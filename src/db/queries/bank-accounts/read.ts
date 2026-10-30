import { db } from "@/db";
import { bankAccount, bankAccountUser } from "@/db/schema";
import { eq, and, isNull, sql, like } from "drizzle-orm";

/* ======
  READ
======= */

/**
 * Retrieves a single bank account if the user has access through Bank_Account__User.
 *
 * @param bankAccountId The unique identifier of the bank account
 * @param userId The unique identifier of the calling user
 * @returns The bank account with the caller's role, or null
 */
export async function getBankAccountById(bankAccountId: string, userId: string) {
    const [row] = await db
        .select({
            id: bankAccount.id,
            name: bankAccount.name,
            initialBalance: bankAccount.initialBalance,
            frozenAt: bankAccount.frozenAt,
            role: bankAccountUser.role,
            createdAt: bankAccount.createdAt,
            updatedAt: bankAccount.updatedAt,
        })
        .from(bankAccount)
        .innerJoin(
            bankAccountUser,
            eq(bankAccount.id, bankAccountUser.bankId)
        )
        .where(
            and(
                eq(bankAccount.id, sql`UUID_TO_BIN(${bankAccountId})`),
                eq(bankAccountUser.userId, sql`UUID_TO_BIN(${userId})`),
                isNull(bankAccount.deletedAt)
            )
        )
        .limit(1);

    return row ?? null;
}

/**
 * Lists all active bank accounts the user belongs to.
 *
 * @param userId The unique identifier of the calling user
 * @param filter Optional filters for frozen state and search query
 */
export async function getBankAccountsByUserId(userId: string, filter?: { frozen?: boolean; q?: string }) {
    const conditions = [
        eq(bankAccountUser.userId, sql`UUID_TO_BIN(${userId})`),
        isNull(bankAccount.deletedAt),
    ];

    if (filter?.frozen !== undefined) {
        conditions.push(filter.frozen ? sql`${bankAccount.frozenAt} IS NOT NULL` : isNull(bankAccount.frozenAt));
    }

    if (filter?.q) {
        conditions.push(like(bankAccount.name, `%${filter.q}%`));
    }

    return db
        .select({
            id: bankAccount.id,
            name: bankAccount.name,
            initialBalance: bankAccount.initialBalance,
            frozenAt: bankAccount.frozenAt,
            role: bankAccountUser.role,
            createdAt: bankAccount.createdAt,
            updatedAt: bankAccount.updatedAt,
        })
        .from(bankAccount)
        .innerJoin(
            bankAccountUser,
            eq(bankAccount.id, bankAccountUser.bankId)
        )
        .where(and(...conditions));
}

/**
 * Finds the membership record and role of a user for a given bank account.
 *
 * @param bankAccountId The unique identifier of the bank account
 * @param userId The unique identifier of the user
 * @returns The membership record containing the role, or null if not a member
 */
export async function findBankAccountMembership(bankAccountId: string, userId: string) {
    const [row] = await db
        .select({
            bankId: bankAccountUser.bankId,
            userId: bankAccountUser.userId,
            role: bankAccountUser.role,
            createdAt: bankAccountUser.createdAt,
            updatedAt: bankAccountUser.updatedAt,
        })
        .from(bankAccountUser)
        .where(
            and(
                eq(bankAccountUser.bankId, sql`UUID_TO_BIN(${bankAccountId})`),
                eq(bankAccountUser.userId, sql`UUID_TO_BIN(${userId})`)
            )
        )
        .limit(1);

    return row ?? null;
}