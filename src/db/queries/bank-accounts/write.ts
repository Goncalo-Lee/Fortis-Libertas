import { db } from "@/db";
import { bankAccount, bankAccountUser, card } from "@/db/schema";
import { generateId } from "@/db/types";
import { ApiError } from "@/lib/api/errors";
import { getBankAccountById } from "./read";
import { CreateBankAccountInput, UpdateBankAccountInput } from "./type";
import { and, eq, isNull, sql } from "drizzle-orm";

/* ======
  WRITE
======= */

/**
 * Creates a new bank account and assigns the caller as owner in Bank_Account__User.
 */
export async function createBankAccount(userId: string, input: CreateBankAccountInput) {
    const id = generateId();

    await db.transaction(async (tx) => {
        await tx.insert(bankAccount).values({
            id,
            name: input.name,
            initialBalance: input.initialBalance,
        });

        await tx.insert(bankAccountUser).values({
            bankId: id,
            userId,
            role: "owner",
        });
    });

    return getBankAccountById(id, userId);
}

/**
 * Updates a bank account (requires editor or owner role).
 */
export async function updateBankAccount(bankAccountId: string, userId: string, input: UpdateBankAccountInput) {
    const current = await getBankAccountById(bankAccountId, userId);
    if (!current) return null;
    if (current.role === "viewer") throw new ApiError("FORBIDDEN");

    const set: Partial<typeof bankAccount.$inferInsert> = {};
    if (input.name !== undefined) set.name = input.name;
    if (input.initialBalance !== undefined) set.initialBalance = input.initialBalance;

    if (Object.keys(set).length > 0) {
        await db
            .update(bankAccount)
            .set({ ...set, updatedAt: new Date() })
            .where(and(eq(bankAccount.id, sql`UUID_TO_BIN(${bankAccountId})`), isNull(bankAccount.deletedAt)));
    }

    return getBankAccountById(bankAccountId, userId);
}

/**
 * Soft-deletes a bank account. Emulates RESTRICT on active cards.
 */
export async function softDeleteBankAccount(bankAccountId: string, userId: string) {
    const current = await getBankAccountById(bankAccountId, userId);
    if (!current) return;
    if (current.role !== "owner") throw new ApiError("FORBIDDEN");

    const [activeCard] = await db
        .select({ id: card.id })
        .from(card)
        .where(and(eq(card.bankId, sql`UUID_TO_BIN(${bankAccountId})`), isNull(card.deletedAt)))
        .limit(1);

    if (activeCard) throw new ApiError("HAS_ACTIVE_CARDS");

    await db
        .update(bankAccount)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(bankAccount.id, sql`UUID_TO_BIN(${bankAccountId})`));
}

/**
 * Freezes or unfreezes a bank account.
 */
export async function setBankAccountFrozenState(bankAccountId: string, userId: string, freeze: boolean) {
    const current = await getBankAccountById(bankAccountId, userId);
    if (!current) return null;
    if (current.role !== "owner") throw new ApiError("FORBIDDEN");

    await db
        .update(bankAccount)
        .set({
            frozenAt: freeze ? new Date() : null,
            updatedAt: new Date(),
        })
        .where(eq(bankAccount.id, sql`UUID_TO_BIN(${bankAccountId})`));

    return getBankAccountById(bankAccountId, userId);
}