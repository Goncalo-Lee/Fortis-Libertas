import { and, asc, count, eq, isNull } from "drizzle-orm";
import { db } from ".."
import { user, userDashboard } from "../schema";
import { ApiError } from "@/lib/api/errors";
import type { Role } from "./dashboards";

// Extracts the transaction type from db.transaction's callback parameter.
// This lets helper functions (like lockOwners) accept a `tx` argument
// with the exact same type Drizzle provides inside a transaction block —
// no manual typing or `any` needed. Clever type gymnastics.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Shared column selection for member queries.
// Joins membership fields with denormalized user info (name, avatar)
// so member lists don't require a second query per row.
const memberColumns = {
  userId: userDashboard.userId,
  role: userDashboard.role,
  createdAt: userDashboard.createdAt,
  updatedAt: userDashboard.updatedAt,
  userName: user.userName,
  fullName: user.name,
  image: user.image,
};

// Reusable predicate for "this membership is active".
// Extracted to avoid repeating the same three conditions across queries.
const activeMember = (dashboardId: string, userId: string) =>
  and(
    eq(userDashboard.dashboardId, dashboardId),
    eq(userDashboard.userId, userId),
    isNull(userDashboard.deletedAt),
  );

/**
 * Fetches a single active member, joining user data.
 * Excludes soft-deleted memberships AND soft-deleted users.
 */
export async function getMember(dashboardId: string, userId: string) {
  const [row] = await db
    .select(memberColumns)
    .from(userDashboard)
    .innerJoin(user, eq(user.id, userDashboard.userId))
    .where(and(activeMember(dashboardId, userId), isNull(user.deletedAt)))
    .limit(1);
  return row ?? null;
}

// Derives the row type from the query itself, so it can never drift
// out of sync with the actual selected columns.
export type MemberRow = NonNullable<Awaited<ReturnType<typeof getMember>>>;

/**
 * Lists members of a dashboard with pagination.
 *
 * Ordering: createdAt ASC, then userId ASC as a tie-breaker.
 * The secondary sort is essential for stable pagination — without it,
 * members created in the same millisecond could shuffle between pages.
 */
export async function listMembers(dashboardId: string, limit: number, offset: number) {
  const where = and(
    eq(userDashboard.dashboardId, dashboardId),
    isNull(userDashboard.deletedAt),
    isNull(user.deletedAt),
  );

  const rows = await db
      .select(memberColumns)
      .from(userDashboard)
      .innerJoin(user, eq(user.id, userDashboard.userId))
      .where(where)
      .orderBy(asc(userDashboard.createdAt), asc(userDashboard.userId))
      .limit(limit)
      .offset(offset);

  // Separate COUNT query for pagination metadata.
  // Runs against the same join + where to stay consistent with `rows`.
  const [totalRow] = await db
      .select({ total: count() })
      .from(userDashboard)
      .innerJoin(user, eq(user.id, userDashboard.userId))
      .where(where);

  return { rows, total: totalRow?.total ?? 0 };
}

/**
 * Resolves an active user's ID by id, email, or username.
 *
 * Used to resolve invite targets (e.g., "invite user@example.com") to a real user ID.
 *
 * Normalization Strategy:
 * - Email: Lowercased (emails are case-insensitive per RFC 5321).
 * - Username: Trimmed (whitespace is usually accidental).
 * - ID: Used as-is (UUIDs are canonical).
 *
 * Priority Order: userId > email > userName.
 * If multiple fields are provided, only the first valid one is used.
 */
export async function findActiveUserId(by: { userId?: string; email?: string; userName?: string }) {
  // Build the WHERE condition based on the first provided identifier.
  // The ternary chain ensures strict priority: if userId exists, email/username are ignored.
  const condition = by.userId
    ? eq(user.id, by.userId)
    : by.email
      ? eq(user.email, by.email.toLowerCase()) // Case-insensitive email lookup
      : eq(user.userName, (by.userName ?? "").trim()); // Trim whitespace from username

  // Query for the user, excluding soft-deleted accounts.
  const [row] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(condition, isNull(user.deletedAt)))
    .limit(1);

  // Return the ID if found, otherwise null.
  return row?.id ?? null;
}

/**
 * Locks the active owner rows of a dashboard and returns how many there are.
 *
 * The `.for("update")` clause acquires row-level locks (SELECT ... FOR UPDATE),
 * preventing concurrent transactions from simultaneously demoting/removing
 * owners and leaving the dashboard ownerless.
 *
 * MUST be called inside a transaction — locking outside one is meaningless
 * because the lock releases immediately.
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
 * Adds a member, or reactivates a soft-deleted membership.
 *
 * Because the PK is (dashboard_id, user_id), a re-invited user already has
 * a row — we can't INSERT a duplicate. Instead we "undelete" the existing row.
 *
 * Concurrency: locks the existing row with FOR UPDATE before deciding,
 * preventing two simultaneous invites from both passing the ALREADY_MEMBER check.
 */
export async function addMember(dashboardId: string, userId: string, role: Role) {
  await db.transaction(async (tx) => {
    // Lock any existing row (active or deleted) for this pair
    const [existing] = await tx
      .select({ deletedAt: userDashboard.deletedAt })
      .from(userDashboard)
      .where(and(eq(userDashboard.dashboardId, dashboardId), eq(userDashboard.userId, userId)))
      .limit(1)
      .for("update");

    // Already an active member -> conflict
    if (existing && !existing.deletedAt) throw new ApiError("ALREADY_MEMBER");

    if (existing) {
      // Reactivate: clear deletedAt and update role
      await tx
        .update(userDashboard)
        .set({ deletedAt: null, role, updatedAt: new Date() })
        .where(and(eq(userDashboard.dashboardId, dashboardId), eq(userDashboard.userId, userId)));
    } else {
      // Fresh membership
      await tx.insert(userDashboard).values({ dashboardId, userId, role });
    }
  });
}

/**
 * Changes a member's role, guarding the "last owner" invariant.
 *
 * Concurrency: lockOwners() acquires FOR UPDATE locks on all owner rows,
 * serializing concurrent role changes so two transactions can't both
 * demote the final two owners and leave zero.
 */
export async function changeMemberRole(dashboardId: string, userId: string, role: Role) {
  await db.transaction(async (tx) => {
    // Lock owners FIRST to establish a consistent snapshot
    const ownerCount = await lockOwners(tx, dashboardId);

    const [target] = await tx
      .select({ role: userDashboard.role })
      .from(userDashboard)
      .where(activeMember(dashboardId, userId))
      .limit(1);

    if (!target) throw new ApiError("NOT_FOUND");

    // Block demoting the sole remaining owner
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
 * Soft-deletes a membership, guarding the "last owner" invariant.
 *
 * Same locking strategy as changeMemberRole: lock owners, verify count,
 * then delete. Prevents the dashboard from ending up with no owner.
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
