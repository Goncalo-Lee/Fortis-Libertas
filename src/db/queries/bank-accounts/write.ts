import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { bankAccount, bankAccountUser, card } from "@/db/schema"; // Ajuste os nomes exportados do seu schema
import { generateId } from "@/db/types";
import { ApiError } from "@/lib/api/errors";
import { getBankAccount } from "./read";

/* ======
  WRITE
======= */

/**
 * Creates a new bank account and assigns the caller as its owner.
 *
 * The bank account and the caller's membership row (with role = 'owner')
 * are inserted in a single transaction.
 *
 * @param userId The unique identifier of the user creating the account
 * @param input The bank account data
 * @param input.name The bank account name
 * @param input.initialBalance The initial balance as a decimal string
 * @returns The created bank account record with the caller's role
 *
 * @example
 * const account = await createBankAccount("user_123", {
 *   name: "Main Savings",
 *   initialBalance: "1250.00",
 * });
 */
export async function createBankAccount(
    userId: string,
    input: { name: string; initialBalance: string }
) {
    const id = generateId();

    await db.transaction(async (tx) => {
        // 1. Inserir a conta bancária[cite: 2]
        await tx.insert(bankAccount).values({
            id,
            name: input.name,
            initialBalance: input.initialBalance,
        });

        // 2. Inserir o utilizador como 'owner' na mesma transação[cite: 2]
        await tx.insert(bankAccountUser).values({
            bankId: id,
            userId,
            role: "owner",
        });
    });

    return getBankAccount(userId, id);
}

/**
 * Updates the name and/or initial balance of an active bank account.
 *
 * Only fields that are provided and actually changed are written.
 * `updated_at` is refreshed whenever a field changes.
 *
 * @param userId The unique identifier of the user (used to return the updated record)
 * @param id The unique identifier of the bank account to update
 * @param changes Fields to update. Omitted fields are left untouched
 * @param changes.name New bank account name
 * @param changes.initialBalance New initial balance
 * @returns The updated bank account record, or `null` if it does not exist or is soft-deleted
 *
 * @example
 * const updated = await updateBankAccount("user_123", "bank_456", { name: "Shared Expenses" });
 */
export async function updateBankAccount(
    userId: string,
    id: string,
    changes: { name?: string; initialBalance?: string }
) {
    const current = await getBankAccount(userId, id);
    if (!current) return null;

    const set: Partial<typeof bankAccount.$inferInsert> = {};
    if (changes.name !== undefined && changes.name !== current.account.name) {
        set.name = changes.name;
    }
    if (changes.initialBalance !== undefined && changes.initialBalance !== current.account.initialBalance) {
        set.initialBalance = changes.initialBalance;
    }

    if (Object.keys(set).length > 0) {
        await db
            .update(bankAccount)
            .set({ ...set, updatedAt: new Date() })
            .where(eq(bankAccount.id, id));
    }

    return getBankAccount(userId, id);
}

/**
 * Toggles the frozen status of a bank account.
 *
 * Sets `frozen_at` to the current timestamp if freezing, or `null` if unfreezing.
 *
 * @param userId The unique identifier of the user (used to return the updated record)
 * @param id The unique identifier of the bank account
 * @param freeze `true` to freeze, `false` to unfreeze
 * @returns The updated bank account record
 */
export async function setBankAccountFreezeState(
    userId: string,
    id: string,
    freeze: boolean
) {
    await db
        .update(bankAccount)
        .set({
            frozenAt: freeze ? new Date() : null, // Set frozen_at = NOW() ou NULL[cite: 2]
            updatedAt: new Date()
        })
        .where(eq(bankAccount.id, id));

    return getBankAccount(userId, id);
}

/**
 * Soft-deletes a bank account and physically removes its members.
 *
 * The deletion is refused if any active card still references the bank account.
 * Otherwise its membership rows are physically deleted and `deleted_at` is set,
 * both in one transaction.
 *
 * @param id The unique identifier of the bank account to delete
 * @returns Nothing. Resolves once the account has been soft-deleted
 * @throws {ApiError} `HAS_ACTIVE_CARDS` if a non-deleted card is linked to the account
 *
 * @example
 * try {
 *   await softDeleteBankAccount("bank_456");
 * } catch (error) {
 *   // Handle HAS_ACTIVE_CARDS
 * }
 */
export async function softDeleteBankAccount(id: string) {
    // Verificar se existem cartões não apagados vinculados a esta conta (RESTRICT)[cite: 2]
    const [used] = await db
        .select({ id: card.id })
        .from(card)
        .where(
            and(
                eq(card.bankId, id),
                isNull(card.deletedAt)
            )
        )
        .limit(1);

    if (used) {
        throw new ApiError("HAS_ACTIVE_CARDS");
    }

    await db.transaction(async (tx) => {
        // 1. Eliminação física dos membros (CASCADE)[cite: 2]
        await tx
            .delete(bankAccountUser)
            .where(eq(bankAccountUser.bankId, id));

        // 2. Soft-delete da conta bancária[cite: 2]
        await tx
            .update(bankAccount)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(eq(bankAccount.id, id));
    });
}