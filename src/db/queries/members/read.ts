import { and, asc, count, eq, isNull } from "drizzle-orm";
import { db } from "../..";
import { user, userDashboard } from "../../schema";

/* ======
  READ
======= */

/**
 * Column selection shared by member queries.
 *
 * Joins membership fields with denormalized user info (name, avatar),
 * so member lists do not need a second query per row.
 */
const memberColumns = {
  userId: userDashboard.userId,
  role: userDashboard.role,
  createdAt: userDashboard.createdAt,
  updatedAt: userDashboard.updatedAt,
  userName: user.userName,
  fullName: user.name,
  image: user.image,
};

/**
 * Predicate for an active membership of a user in a dashboard.
 *
 * Exported so that the write operations apply the same definition of "active".
 *
 * @param dashboardId - The dashboard ID
 * @param userId - The user ID
 * @returns A Drizzle SQL condition matching the non-deleted membership
 *
 * @example
 * await db.select().from(userDashboard).where(activeMember("dash_123", "user_456"));
 */
export const activeMember = (dashboardId: string, userId: string) =>
  and(
    eq(userDashboard.dashboardId, dashboardId),
    eq(userDashboard.userId, userId),
    isNull(userDashboard.deletedAt),
  );

/**
 * Fetches a single active member of a dashboard, with joined user data.
 *
 * Excludes soft-deleted memberships and soft-deleted users.
 *
 * @param dashboardId - The dashboard ID
 * @param userId - The user ID of the member
 * @returns The member row, or `null` if the user is not an active member
 *
 * @example
 * const member = await getMember("dash_123", "user_456");
 * if (member) console.log(`${member.fullName} is a ${member.role}.`);
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

/**
 * Lists the active members of a dashboard with pagination.
 *
 * Ordering: `createdAt` ascending, then `userId` ascending as a tie-breaker.
 * The secondary sort keeps pagination stable when members share the same timestamp.
 *
 * @param dashboardId - The dashboard ID
 * @param limit - Maximum number of members to return
 * @param offset - Number of members to skip
 * @returns The current page of member rows and the total number of active members
 *
 * @example
 * const { rows, total } = await listMembers("dash_123", 20, 0);
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

  // Separate COUNT query for pagination metadata, using the same join and filters as `rows`
  const [totalRow] = await db
    .select({ total: count() })
    .from(userDashboard)
    .innerJoin(user, eq(user.id, userDashboard.userId))
    .where(where);

  return { rows, total: totalRow?.total ?? 0 };
}
