import { and, asc, count, desc, eq, isNotNull, isNull, like } from "drizzle-orm";
import { db } from "..";
import { dashboard, recordType, userDashboard } from "../schema";
import { generateId } from "../types";
import { isNotNil } from "recharts/types/util/DataUtils";

export type Role = "owner" | "editor" | "viewer";

const DEFAULT_RECORD_TYPES = ["Expenses", "Income", "Investment"];

/**
 * Escapes special characters for SQL LIKE queries.
 * Prevents injection of wildcards (%) or underscores (_) via user input.
 * Also escapes the backslash itself to ensure it's treated literally.
 */
const escapeLike = (value: string) => value.replace(/[\\%_]/, "\\$&");

/**
 * Checks if a user has active membership in a specific dashboard.
 *
 * Ensures both the membership row AND the dashboard itself are not soft-deleted.
 * Returns null if the user is not a member or if either entity is deleted.
 *
 * @param dashboardId - The target dashboard ID
 * @param userId - The user ID to check
 * @returns Membership object { dashboard, role } or null
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
 * Counts active members in a dashboard.
 *
 * Used for enforcing constraints (e.g., "cannot delete last owner").
 * Excludes soft-deleted memberships.
 */
export async function countMembers(dashboardId: string) {
  const [row] = await db
    .select({ total: count() })
    .from(userDashboard)
    .where(
      and(
        eq(userDashboard.dashboardId, dashboardId),
        isNull(userDashboard.deletedAt)
      )
    );

  return row?.total ?? 0;
}

type ListFilters = {
  is_active?: boolean;
  role?: Role;
  q?: string;
  sort: "name" | "-name" | "created_at" | "-created_at";
  limit: number;
  offset: number;
   deleted?: boolean
}

/**
 * Lists dashboards for a user with advanced filtering and sorting.
 *
 * Features:
 * - Filters by activity status, role, and search query (LIKE).
 * - Supports ascending/descending sort on name or created_at.
 * - Uses a secondary sort on `id` as a tie-breaker to ensure stable pagination.
 * - Performs a separate COUNT query for total pages.
 *
 * @param userId - The requesting user
 * @param f - Filter and pagination parameters
 * @returns { rows: [], total: number }
 */
export async function listDashboards(userId: string, f: ListFilters) {
  // Build dynamic WHERE clause
  const where = and(
    eq(userDashboard.userId, userId),

    // Default behavior: Exclude soft-deleted memberships
    isNull(userDashboard.deletedAt),

    // NEW LOGIC: Handle dashboard deletion status based on `f.deleted` flag
    // If f.deleted is true: Show ONLY deleted dashboards (isNotNull)
    // If f.deleted is false/undefined: Show ONLY active dashboards (isNull)
    f.deleted ? isNotNull(dashboard.deletedAt) : isNull(dashboard.deletedAt),

    // Optional filters: only include if defined
    f.is_active === undefined ? undefined : eq(dashboard.isActive, f.is_active),
    f.role ? eq(userDashboard.role, f.role) : undefined,
    f.q ? like(dashboard.name, `%${escapeLike(f.q)}%`) : undefined,

    // SECURITY CONSTRAINT: Only owners can see deleted dashboards.
    // If f.deleted is true, we enforce that the user must have "owner" role.
    // This prevents viewers/editors from enumerating deleted dashboards they don't own.
    f.deleted ? eq(userDashboard.role, "owner") : undefined,
  );

  // Map sort string to Drizzle column direction
  const order = {
    name: asc(dashboard.name),
    "-name": desc(dashboard.name),
    created_at: asc(dashboard.createdAt),
    "-created_at": desc(dashboard.createdAt),
  }[f.sort];

  // Fetch paginated rows
  const rows = await db
    .select({ dashboard, role: userDashboard.role })
    .from(userDashboard)
    .innerJoin(dashboard, eq(dashboard.id, userDashboard.dashboardId))
    .where(where)
    .orderBy(order, asc(dashboard.id)) // Tie-breaker for stable pagination
    .limit(f.limit)
    .offset(f.offset);

  // Fetch total count for pagination metadata
  // Note: The COUNT query uses the SAME `where` clause, ensuring consistency
  // between the number of rows returned and the `total` value.
  const [totalRow] = await db
    .select({ total: count() })
    .from(userDashboard)
    .innerJoin(dashboard, eq(dashboard.id, userDashboard.dashboardId))
    .where(where);

  return { rows, total: totalRow?.total ?? 0 };
}

/**
 * Creates a new dashboard atomically.
 *
 * Transaction ensures:
 * 1. Dashboard record is created.
 * 2. Owner membership is created.
 * 3. Default record types (Expenses, Income, Investment) are seeded.
 *
 * If any step fails, the entire transaction rolls back.
 *
 * @param userId - The ID of the new owner
 * @param input - Dashboard name and optional active status
 * @returns The generated dashboard ID
 */
export async function createDashboard(userId: string, input: { name: string; is_active?: boolean }) {
  const id = generateId();

  await db.transaction(async (tx) => {
    // 1. Create Dashboard
    await tx.insert(dashboard).values({
      id,
      name: input.name,
      isActive: input.is_active ?? true,
    });

    // 2. Create Owner Membership
    await tx.insert(userDashboard).values({ dashboardId: id, userId, role: "owner" });

    // 3. Seed Default Record Types
    await tx.insert(recordType).values(
      DEFAULT_RECORD_TYPES.map((name) => ({ id: generateId(), dashboardId: id, name })),
    );
  });

  return id;
}

/**
 * Updates a dashboard's name and/or active status.
 *
 * Builds a dynamic SET clause containing only the fields explicitly provided,
 * so a partial payload never overwrites unrelated columns.
 *
 * @param id - Dashboard ID
 * @param changes - Partial update payload
 * @returns Updated dashboard row, or null if not found/already deleted
 */
export async function updateDashboard(id: string, changes: { name?: string; is_active?: boolean }) {
  // Accumulator for the fields that will actually be written.
  // Typed against the insert model so column names/types are checked at compile time.
  const set: Partial<typeof dashboard.$inferInsert> = {};

  // Map API (snake_case) -> DB (camelCase), guarding with !== undefined
  // so that `false` and empty strings are still applied (only `undefined` is skipped).
  if (changes.name !== undefined) set.name = changes.name;
  if (changes.is_active !== undefined) set.isActive = changes.is_active;

  // Skip the write entirely when nothing changed.
  // Avoids a pointless UPDATE and an unnecessary `updatedAt` bump.
  if (Object.keys(set).length > 0) {
    await db
      .update(dashboard)
      .set({ ...set, updatedAt: new Date() }) // Always refresh the audit timestamp
      .where(and(eq(dashboard.id, id), isNull(dashboard.deletedAt))); // Soft-delete guard
  }

  // Re-read to return the authoritative post-update state.
  // Note: this SELECT does NOT filter on deletedAt, so a soft-deleted
  // dashboard would still be returned here (see note below).
  const [row] = await db.select().from(dashboard).where(eq(dashboard.id, id)).limit(1);

  return row ?? null;
}

/**
 * Soft deletes a dashboard by setting `deletedAt`.
 *
 * Idempotent: safe to call multiple times.
 * The `where` clause ensures we only update if it wasn't already deleted.
 */
export async function softDeleteDashboard(id: string) {
  await db
    .update(dashboard)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(dashboard.id, id), isNull(dashboard.deletedAt)));
}

/**
 * Restores a soft-deleted dashboard by clearing its `deletedAt` timestamp.
 *
 * Only affects dashboards that are currently deleted (guarded by
 * `isNotNull(dashboard.deletedAt)`), making the operation idempotent-ish:
 * restoring an already-active dashboard is a no-op rather than an error.
 *
 * @param id - Dashboard ID
 * @returns The restored dashboard row, or null if not found
 */
export async function restoreDashboard(id: string) {
  // Clear deletedAt, but ONLY if the row is currently deleted.
  // The isNotNull guard prevents accidentally bumping updatedAt on
  // an already-active dashboard.
  await db
    .update(dashboard)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(and(eq(dashboard.id, id), isNotNull(dashboard.deletedAt)));

  // Read back the row — note this SELECT does NOT filter on deletedAt,
  // so it returns the row regardless of whether the UPDATE matched.
  const [row] = await db.select().from(dashboard).where(eq(dashboard.id, id)).limit(1);

  return row ?? null;
}
