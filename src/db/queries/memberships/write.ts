import { and, eq, isNull } from "drizzle-orm";
import { ApiError } from "@/lib/api/errors";
import { db } from "../..";
import type { Role } from "../type";
import { activeMember } from "./read";
import { Membership, Tx } from "./type";
import { createNotification } from "../notifications/write";

/* =======
  WRITE
======== */

// Locks the active owners of the scope (SELECT ... FOR UPDATE) and returns how many there are,
// so two concurrent requests cannot both remove the last owners.
async function lockOwners(tx: Tx, m: Membership, scopeId: string) {
  const owners = await tx
    .select({ userId: m.table.userId })
    .from(m.table)
    .where(and(eq(m.scopeId, scopeId), eq(m.table.role, "owner"), isNull(m.table.deletedAt)))
    .for("update");

  return owners.length;
}

/**
 * Adds a member. If the user was removed before, the row is reactivated with the new role,
 * because `(scope, user)` is the primary key.
 *
 * The new member is notified in the same transaction (`dashboard.member_added` / `bank_account.member_added`),
 * so the notification exists only if the membership was really saved.
 *
 * @param addedBy - The user who made the request, stored in the notification as `added_by`
 * @throws {ApiError} `ALREADY_MEMBER` when the user is an active member
 */
export async function addMember(m: Membership, scopeId: string, userId: string, role: Role, addedBy: string) {
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ deletedAt: m.table.deletedAt })
      .from(m.table)
      .where(and(eq(m.scopeId, scopeId), eq(m.table.userId, userId)))
      .limit(1)
      .for("update");

    if (existing && !existing.deletedAt) throw new ApiError("ALREADY_MEMBER");

    if (existing) {
      await tx
        .update(m.table)
        .set({ deletedAt: null, role, updatedAt: new Date() })
        .where(and(eq(m.scopeId, scopeId), eq(m.table.userId, userId)));
    } else {
      await tx.insert(m.table).values({ [m.scopeKey]: scopeId, userId, role } as never);
    }

    const { type, scopeField } = m.addedNotification;
    await createNotification(tx, userId, type, { [scopeField]: scopeId, role, added_by: addedBy });
  });
}

/**
 * Changes a member's role.
 *
 * @throws {ApiError} `NOT_FOUND` when the user is not an active member; `LAST_OWNER` when it would demote the last owner
 */
export async function changeMemberRole(m: Membership, scopeId: string, userId: string, role: Role) {
  await db.transaction(async (tx) => {
    const ownerCount = await lockOwners(tx, m, scopeId);

    const [target] = await tx
      .select({ role: m.table.role })
      .from(m.table)
      .where(activeMember(m, scopeId, userId))
      .limit(1);

    if (!target) throw new ApiError("NOT_FOUND");

    if (target.role === "owner" && role !== "owner" && ownerCount <= 1) {
      throw new ApiError("LAST_OWNER");
    }

    await tx
      .update(m.table)
      .set({ role, updatedAt: new Date() })
      .where(activeMember(m, scopeId, userId));
  });
}

/**
 * Removes a member (soft delete).
 *
 * `beforeRemove` runs inside the transaction once the member is known to exist, for rules that belong to
 * one scope only (for example, a bank account member who still owns cards cannot be removed).
 *
 * @throws {ApiError} `NOT_FOUND` when the user is not an active member; `LAST_OWNER` when it would remove the last owner
 */
export async function removeMember(
  m: Membership,
  scopeId: string,
  userId: string,
  beforeRemove?: (tx: Tx) => Promise<void>,
) {
  await db.transaction(async (tx) => {
    const ownerCount = await lockOwners(tx, m, scopeId);

    const [target] = await tx
      .select({ role: m.table.role })
      .from(m.table)
      .where(activeMember(m, scopeId, userId))
      .limit(1);

    if (!target) throw new ApiError("NOT_FOUND");

    if (beforeRemove) await beforeRemove(tx);

    if (target.role === "owner" && ownerCount <= 1) throw new ApiError("LAST_OWNER");

    await tx
      .update(m.table)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(activeMember(m, scopeId, userId));
  });
}
