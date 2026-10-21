import { and, count, desc, asc, eq, isNotNull, isNull, like } from "drizzle-orm";
import { db } from "../..";
import { dashboard, userDashboard } from "../../schema";
import { ListFiltersDashboards } from "./type";

/* ======
  READ
======= */

/**
 * Escapes the special characters of SQL `LIKE` patterns (`\`, `%` and `_`)
 * so user input is matched literally.
 *
 * @param value - Raw user input
 * @returns The value with every special character prefixed by a backslash
 *
 * @example
 * escapeLike("50%_off"); // "50\\%\\_off"
 */
const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

/**
 * Checks whether a user has an active membership in a dashboard.
 *
 * Both the membership row and the dashboard itself must be non-deleted,
 * unless `includeDeleted` is `true`, which ignores the dashboard's deletion state.
 *
 * @param dashboardId - The target dashboard ID
 * @param userId - The user ID to check
 * @param includeDeleted - When `true`, also matches dashboards that are soft-deleted
 * @returns The `{ dashboard, role }` pair, or `null` if the user is not an active member
 *
 * @example
 * const membership = await findMembership("dash_123", "user_456");
 * if (membership?.role === "owner") {
 *   console.log("User can manage this dashboard.");
 * }
 */
export async function findMembership(
  dashboardId: string,
  userId: string,
  includeDeleted = false,
) {
  const [row] = await db
    .select({ dashboard, role: userDashboard.role })
    .from(userDashboard)
    .innerJoin(dashboard, eq(dashboard.id, userDashboard.dashboardId))
    .where(
      and(
        eq(userDashboard.dashboardId, dashboardId),
        eq(userDashboard.userId, userId),
        isNull(userDashboard.deletedAt),
        includeDeleted ? undefined : isNull(dashboard.deletedAt),
      ),
    )
    .limit(1);

  return row ?? null;
}

/**
 * Counts the active members of a dashboard.
 *
 * Used to enforce constraints such as "a dashboard cannot lose its last owner".
 * Soft-deleted memberships are excluded.
 *
 * @param dashboardId - The dashboard ID
 * @returns The number of active memberships
 *
 * @example
 * const total = await countMembers("dash_123");
 * console.log(`The dashboard has ${total} members.`);
 */
export async function countMembers(dashboardId: string) {
  const [row] = await db
    .select({ total: count() })
    .from(userDashboard)
    .where(
      and(
        eq(userDashboard.dashboardId, dashboardId),
        isNull(userDashboard.deletedAt),
      ),
    );

  return row?.total ?? 0;
}

/**
 * Lists the dashboards a user belongs to, with filtering, sorting and pagination.
 *
 * Features:
 * - Filters by active status, role and a name search (`LIKE`).
 * - Sorts by name or creation date, ascending or descending.
 * - Uses `id` as a secondary sort so pagination stays stable.
 * - Runs a separate COUNT query with the same filters for pagination metadata.
 *
 * Deleted dashboards are only returned when `f.deleted` is `true` and the user
 * is an owner, so viewers and editors cannot enumerate deleted dashboards.
 *
 * @param userId - The requesting user's ID
 * @param f - Filter, sort and pagination parameters (see `ListFilters`)
 * @returns The current page of `{ dashboard, role }` rows and the total matching count
 *
 * @example
 * const { rows, total } = await listDashboards("user_456", {
 *   sort: "-created_at",
 *   limit: 10,
 *   offset: 0,
 *   is_active: true,
 * });
 */
export async function listDashboards(userId: string, f: ListFiltersDashboards) {
  // Dynamic WHERE clause shared by the rows query and the count query,
  // so `rows` and `total` always stay consistent.
  const where = and(
    eq(userDashboard.userId, userId),

    // Exclude soft-deleted memberships
    isNull(userDashboard.deletedAt),

    // Show only deleted dashboards when `f.deleted` is true, otherwise only active ones
    f.deleted ? isNotNull(dashboard.deletedAt) : isNull(dashboard.deletedAt),

    // Optional filters, applied only when defined
    f.is_active === undefined ? undefined : eq(dashboard.isActive, f.is_active),
    f.role ? eq(userDashboard.role, f.role) : undefined,
    f.q ? like(dashboard.name, `%${escapeLike(f.q)}%`) : undefined,

    // Only owners can see deleted dashboards
    f.deleted ? eq(userDashboard.role, "owner") : undefined,
  );

  // Maps the API sort string to a Drizzle ordering
  const order = {
    name: asc(dashboard.name),
    "-name": desc(dashboard.name),
    created_at: asc(dashboard.createdAt),
    "-created_at": desc(dashboard.createdAt),
  }[f.sort];

  const rows = await db
    .select({ dashboard, role: userDashboard.role })
    .from(userDashboard)
    .innerJoin(dashboard, eq(dashboard.id, userDashboard.dashboardId))
    .where(where)
    .orderBy(order, asc(dashboard.id)) // `id` as tie-breaker for stable pagination
    .limit(f.limit)
    .offset(f.offset);

  const [totalRow] = await db
    .select({ total: count() })
    .from(userDashboard)
    .innerJoin(dashboard, eq(dashboard.id, userDashboard.dashboardId))
    .where(where);

  return { rows, total: totalRow?.total ?? 0 };
}
