import { db } from "@/db";
import { bankAccountUser, user, card } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import { and, eq, sql, count, isNull } from "drizzle-orm";
import { AddBankAccountMemberInput } from "./type";

/* ======
  WRITE
======= */

/**
 * Adds a new member to a bank account.
 */
export async function addBankAccountMember(bankAccountId: string, callerUserId: string, input: AddBankAccountMemberInput) {
    let targetUserId = input.userId;

    if (!targetUserId) {
        const [target] = await db
            .select({ id: user.id })
            .from(user)
            .where(input.email ? eq(user.email, input.email) : eq(user.username, input.userName!))
            .limit(1);

        if (!target) throw new ApiError("NOT_FOUND");
        targetUserId = target.id;
    }

    const [existing] = await db
        .select({ id: bankAccountUser.userId })
        .from(bankAccountUser)
        .where(and(
            eq(bankAccountUser.bankId, sql`UUID_TO_BIN(${bankAccountId})`),
            eq(bankAccountUser.userId, sql`UUID_TO_BIN(${targetUserId})`)
        ))
        .limit(1);

    if (existing) throw new ApiError("ALREADY_MEMBER");

    await db.insert(bankAccountUser).values({
        bankId: bankAccountId,
        userId: targetUserId,
        role: input.role,
    });

    return { userId: targetUserId, role: input.role };
}

/**
 * Updates a member's role (validating that the account retains at least one owner).
 */
export async function updateBankAccountMemberRole(
    bankAccountId: string,
    callerUserId: string,
    targetUserId: string,
    newRole: "owner" | "editor" | "viewer"
) {
    if (newRole !== "owner") {
        const [ownerCount] = await db
            .select({ count: count() })
            .from(bankAccountUser)
            .where(and(
                eq(bankAccountUser.bankId, sql`UUID_TO_BIN(${bankAccountId})`),
                eq(bankAccountUser.role, "owner")
            ));

        if (Number(ownerCount.count) <= 1) {
            const [isTargetOwner] = await db
                .select({ role: bankAccountUser.role })
                .from(bankAccountUser)
                .where(and(
                    eq(bankAccountUser.bankId, sql`UUID_TO_BIN(${bankAccountId})`),
                    eq(bankAccountUser.userId, sql`UUID_TO_BIN(${targetUserId})`)
                ));

            if (isTargetOwner?.role === "owner") throw new ApiError("LAST_OWNER");
        }
    }

    await db
        .update(bankAccountUser)
        .set({ role: newRole, updatedAt: new Date() })
        .where(and(
            eq(bankAccountUser.bankId, sql`UUID_TO_BIN(${bankAccountId})`),
            eq(bankAccountUser.userId, sql`UUID_TO_BIN(${targetUserId})`)
        ));

    return { userId: targetUserId, role: newRole };
}

/**
 * Removes a member from a bank account (validating LAST_OWNER and MEMBER_HAS_CARDS).
 */
export async function removeBankAccountMember(bankAccountId: string, callerUserId: string, targetUserId: string) {
    const [activeCards] = await db
        .select({ id: card.id })
        .from(card)
        .where(and(
            eq(card.bankId, sql`UUID_TO_BIN(${bankAccountId})`),
            eq(card.userId, sql`UUID_TO_BIN(${targetUserId})`),
            isNull(card.deletedAt)
        ))
        .limit(1);

    if (activeCards) throw new ApiError("MEMBER_HAS_CARDS");

    const [ownerCount] = await db
        .select({ count: count() })
        .from(bankAccountUser)
        .where(and(
            eq(bankAccountUser.bankId, sql`UUID_TO_BIN(${bankAccountId})`),
            eq(bankAccountUser.role, "owner")
        ));

    const [targetMember] = await db
        .select({ role: bankAccountUser.role })
        .from(bankAccountUser)
        .where(and(
            eq(bankAccountUser.bankId, sql`UUID_TO_BIN(${bankAccountId})`),
            eq(bankAccountUser.userId, sql`UUID_TO_BIN(${targetUserId})`)
        ));

    if (targetMember?.role === "owner" && Number(ownerCount.count) <= 1) {
        throw new ApiError("LAST_OWNER");
    }

    await db
        .delete(bankAccountUser)
        .where(and(
            eq(bankAccountUser.bankId, sql`UUID_TO_BIN(${bankAccountId})`),
            eq(bankAccountUser.userId, sql`UUID_TO_BIN(${targetUserId})`)
        ));
}