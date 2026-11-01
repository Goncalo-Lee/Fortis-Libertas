import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { card, user } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import * as memberships from "../memberships";
import type { AddBankAccountMemberInput } from "./type";

/* ======
  WRITE
======= */

/**
 * Adds a member to a bank account, or reactivates a removed one. The target is given by id, email or user name.
 *
 * @throws {ApiError} `NOT_FOUND` if the user does not exist; `ALREADY_MEMBER` if already an active member
 */
export async function addBankAccountMember(
  bankAccountId: string,
  callerUserId: string,
  input: AddBankAccountMemberInput,
) {
  const lookup = input.userId
    ? eq(user.id, input.userId)
    : input.email
      ? eq(user.email, input.email)
      : eq(user.username, input.userName ?? "");

  const [target] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(lookup, isNull(user.deletedAt)))
    .limit(1);

  if (!target) throw new ApiError("NOT_FOUND");

  await memberships.addMember(memberships.bankAccountMembership, bankAccountId, target.id, input.role);

  return { userId: target.id, role: input.role };
}

/** Changes a member's role. `NOT_FOUND` if not a member, `LAST_OWNER` if it would demote the last owner. */
export async function updateBankAccountMemberRole(
  bankAccountId: string,
  callerUserId: string,
  targetUserId: string,
  newRole: memberships.Role,
) {
  await memberships.changeMemberRole(memberships.bankAccountMembership, bankAccountId, targetUserId, newRole);
  return { userId: targetUserId, role: newRole };
}

/**
 * Removes a member (soft delete).
 *
 * @throws {ApiError} `NOT_FOUND` if not a member; `MEMBER_HAS_CARDS` while the member owns non-deleted cards
 *   on the account; `LAST_OWNER` if it is the last owner
 */
export async function removeBankAccountMember(bankAccountId: string, callerUserId: string, targetUserId: string) {
  await memberships.removeMember(memberships.bankAccountMembership, bankAccountId, targetUserId, async (tx) => {
    const [activeCard] = await tx
      .select({ id: card.id })
      .from(card)
      .where(and(eq(card.bankId, bankAccountId), eq(card.userId, targetUserId), isNull(card.deletedAt)))
      .limit(1);

    if (activeCard) throw new ApiError("MEMBER_HAS_CARDS");
  });
}
