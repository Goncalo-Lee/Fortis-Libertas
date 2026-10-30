import { db } from "@/db";
import { bankAccountUser, user } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/* ======
  READ
======= */

/**
 * Lists all members belonging to a bank account.
 */
export async function listBankAccountMembers(bankAccountId: string, callerUserId: string) {
    return db
        .select({
            userId: user.id,
            userName: user.username,
            fullName: user.name,
            image: user.image,
            role: bankAccountUser.role,
            createdAt: bankAccountUser.createdAt,
            updatedAt: bankAccountUser.updatedAt,
        })
        .from(bankAccountUser)
        .innerJoin(user, eq(bankAccountUser.userId, user.id))
        .where(eq(bankAccountUser.bankId, sql`UUID_TO_BIN
        (
        ${bankAccountId}
        )`));
}