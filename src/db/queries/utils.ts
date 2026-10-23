import { and, eq, isNull, type AnyColumn } from "drizzle-orm";
import type { MySqlColumn, MySqlTable } from "drizzle-orm/mysql-core";
import { db } from "..";

/* ===============
  DashboardEntity
================ */

// Defines the minimum structure required for an entity to be filtered by dashboard and soft delete status
interface DashboardEntity {
  dashboardId: MySqlColumn;
  id: MySqlColumn;
  deletedAt: MySqlColumn;
}

/**
 * Creates a filter condition to ensure that a record belongs to a specific dashboard,
 * matches the given ID, and has not been deleted (active record check).
 *
 * @param table - The Drizzle ORM table containing `dashboardId`, `id`, and `deletedAt` columns
 * @param dashboardId - The unique identifier of the dashboard
 * @param id - The unique identifier of the record
 * @returns A Drizzle SQL condition combining dashboard, ID, and non-deletion checks
 *
 * @example
 * // Check if a specific user belongs to the dashboard and is active
 * const user = await db
 *   .select()
 *   .from(usersTable)
 *   .where(inDashboard(usersTable, "dash_123", "user_456"))
 *   .limit(1);
 */
export const inDashboard = <T extends DashboardEntity>(
  table: T,
  dashboardId: string,
  id: string
) =>
  and(
    eq(table.dashboardId, dashboardId),
    eq(table.id, id),
    isNull(table.deletedAt)
  );

/**
 * Creates a filter condition to ensure that a record has been deleted (soft delete check).
 *
 * @param table - The Drizzle ORM table containing a `deletedAt` column
 * @returns A Drizzle SQL condition checking if `deletedAt` is not null
 *
 * @example
 * // Fetch all soft-deleted posts in a cleanup or trash view
 * const deletedPosts = await db
 *   .select()
 *   .from(postsTable)
 *   .where(notDeleted(postsTable));
 */
export const notDeleted = <T extends { deletedAt: AnyColumn }>(
  table: T
) =>
  isNull(table.deletedAt);

/* ===============
  NameTaken
================ */

// Defines a generic structure for a MySQL table used by the uniqueness check
type NameTakenTable = MySqlTable & {
  id: MySqlColumn;
  dashboardId: MySqlColumn;
  name: MySqlColumn;
};

// Parameters required for the nameTaken function
export interface NameTakenParams<T extends NameTakenTable> {
  table: T;                 // The database table to query
  dashboardId: string;      // The scope/dashboard ID where the name should be unique
  name: string;             // The name to check for availability
  exceptId?: string;        // Optional ID to exclude from the check (useful during updates)
}

/**
 * Checks if a given name is already taken within a specific dashboard.
 *
 * @param params - The configuration parameters including table, dashboardId, name, and optional exceptId
 * @returns A boolean promise indicating whether the name is taken (true) or available (false)
 *
 * @example
 * await nameTaken({ table: tag, dashboardId, name });
 * await nameTaken({ table: tag, dashboardId, name, exceptId: tagId });
 */
export async function nameTaken<T extends NameTakenTable>({
  table,
  dashboardId,
  name,
  exceptId,
}: NameTakenParams<T>) {
  // Query up to 2 rows matching the dashboard and the name to optimize performance
  const rows = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.dashboardId, dashboardId), eq(table.name, name)))
    .limit(2);

  // Return true if any found record has an ID different from the excluded ID (exceptId)
  return rows.some(
    (r) => String(r.id).toLowerCase() !== exceptId?.toLowerCase(),
  );
}
