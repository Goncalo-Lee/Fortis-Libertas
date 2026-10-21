import { and, eq, isNull } from "drizzle-orm";
import { ApiError } from "@/lib/api/errors";
import { db } from "../..";
import { userDashboard } from "../../schema";
import type { Role } from "../dashboards/type";
import { activeMember } from "./read";
import type { Tx } from "./type";

/* =======
  WRITE
======== */

/**
 * Locks the active owner rows of a dashboard and returns how many there are.
 *
 * Uses `SELECT ... FOR UPDATE` to take row-level locks, which stops concurrent
 * transactions from demoting or removing owners at the same time and leaving
 * the dashboard without one.
 *
 * Must be called inside a transaction, since the lock is released when the
 * transaction ends.
 *
 * @param tx - The active transaction
 * @param dashboardId - The dashboard ID
 * @returns The number of active owners, now locked
 *
 * @example
 * await db.transaction(async (tx) => {
 *   const ownerCount = await lockOwners(tx, "dash_123");
 * });
 */
async function lockOwners(tx: Tx, dashboardId: string) {
  const owners = await tx
    .select({ userId: userDashboard.userId })
    .from(userDashboard)
    .where(
      and(
        eq(userDashboard.dashboardId, dashboardId),
        eq(userDashboard.role, "owner"),
        isNull(userDashboard.deletedAt),
      ),
    )
    .for("update");

  return owners.length;
}

/**
 * Adds a member to a dashboard, or reactivates a soft-deleted membership.
 *
 * The primary key is `(dashboard_id, user_id)`, so a previously removed user
 * already has a row. In that case the row is reactivated instead of inserted.
 *
 * Concurrency: the existing row is locked with `FOR UPDATE` before the check,
 * so two simultaneous invites cannot both pass the `ALREADY_MEMBER` check.
 *
 * @param dashboardId - The dashboard ID
 * @param userId - The ID of the user to add
 * @param role - The role to assign
 * @throws {ApiError} `ALREADY_MEMBER` if the user is already an active member
 *
 * @example
 * await addMember("dash_123", "user_456", "editor");
 */
export async function addMember(dashboardId: string, userId: string, role: Role) {
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ deletedAt: userDashboard.deletedAt })
      .from(userDashboard)
      .where(and(eq(userDashboard.dashboardId, dashboardId), eq(userDashboard.userId, userId)))
      .limit(1)
      .for("update");

    if (existing && !existing.deletedAt) throw new ApiError("ALREADY_MEMBER");

    if (existing) {
      // Reactivate the soft-deleted membership with the new role
      await tx
        .update(userDashboard)
        .set({ deletedAt: null, role, updatedAt: new Date() })
        .where(and(eq(userDashboard.dashboardId, dashboardId), eq(userDashboard.userId, userId)));
    } else {
      await tx.insert(userDashboard).values({ dashboardId, userId, role });
    }
  });
}

/**
 * Changes an active member's role, enforcing the "last owner" invariant.
 *
 * Owners are locked first with `lockOwners`, which serializes concurrent role
 * changes. Otherwise two transactions could each demote one of the last two
 * owners and leave the dashboard with none.
 *
 * @param dashboardId - The dashboard ID
 * @param userId - The ID of the member whose role changes
 * @param role - The new role
 * @throws {ApiError} `NOT_FOUND` if the user is not an active member
 * @throws {ApiError} `LAST_OWNER` if this would demote the only remaining owner
 *
 * @example
 * await changeMemberRole("dash_123", "user_456", "viewer");
 */
export async function changeMemberRole(dashboardId: string, userId: string, role: Role) {
  await db.transaction(async (tx) => {
    const ownerCount = await lockOwners(tx, dashboardId);

    const [target] = await tx
      .select({ role: userDashboard.role })
      .from(userDashboard)
      .where(activeMember(dashboardId, userId))
      .limit(1);

    if (!target) throw new ApiError("NOT_FOUND");

    if (target.role === "owner" && role !== "owner" && ownerCount <= 1) {
      throw new ApiError("LAST_OWNER");
    }

    await tx
      .update(userDashboard)
      .set({ role, updatedAt: new Date() })
      .where(activeMember(dashboardId, userId));
  });
}

/**
 * Soft-removes a member from a dashboard, enforcing the "last owner" invariant.
 *
 * Uses the same locking strategy as `changeMemberRole`: lock the owners,
 * check the count, then delete.
 *
 * @param dashboardId - The dashboard ID
 * @param userId - The ID of the member to remove
 * @throws {ApiError} `NOT_FOUND` if the user is not an active member
 * @throws {ApiError} `LAST_OWNER` if the member is the only remaining owner
 *
 * @example
 * await removeMember("dash_123", "user_456");
 */
export async function removeMember(dashboardId: string, userId: string) {
  await db.transaction(async (tx) => {
    const ownerCount = await lockOwners(tx, dashboardId);

    const [target] = await tx
      .select({ role: userDashboard.role })
      .from(userDashboard)
      .where(activeMember(dashboardId, userId))
      .limit(1);

    if (!target) throw new ApiError("NOT_FOUND");

    if (target.role === "owner" && ownerCount <= 1) throw new ApiError("LAST_OWNER");

    await tx
      .update(userDashboard)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(activeMember(dashboardId, userId));
  });
}
