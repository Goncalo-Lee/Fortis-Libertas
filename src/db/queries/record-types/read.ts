import { and, asc, count, desc, eq, isNull, like } from "drizzle-orm";
import { db } from "../..";
import { recordType } from "../../schema";
import { escapeLike } from "../../utils";
import { inDashboard } from "./../utils";
import { ListFilters } from "./../type";

/* ======
  READ
======= */

/**
 * Retrieves a single record type by its ID within a specific dashboard, ensuring it is not deleted.
 *
 * @param dashboardId - The unique identifier of the dashboard owning the record type
 * @param id - The unique identifier of the record type
 * @returns The record type if found, or `null` if no matching active record exists
 *
 * @example
 * const recordType = await getRecordType("dash_123", "rt_456");
 * if (recordType) {
 *   console.log(`Record type found: ${recordType.name}`);
 * } else {
 *   console.log("Record type not found or soft-deleted.");
 * }
 */
export async function getRecordType(dashboardId: string, id: string) {
  const [row] = await db
    .select()
    .from(recordType)
    .where(inDashboard(recordType, dashboardId, id))
    .limit(1);

  return row ?? null;
}

/**
 * Lists the active record types of a dashboard, with optional name search, sorting and pagination.
 *
 * @param dashboardId - The unique identifier of the dashboard owning the record types
 * @param f - Filters: `q` (name substring), `sort` (`name`, `-name`, `created_at`, `-created_at`), `limit` and `offset`
 * @returns The current page of rows and the total number of rows matching the filters
 *
 * @example
 * const { rows, total } = await listRecordTypes("dash_123", {
 *   q: "fatura",
 *   sort: "name",
 *   limit: 20,
 *   offset: 0,
 * });
 * console.log(`Showing ${rows.length} of ${total} record types.`);
 */
export async function listRecordTypes(dashboardId: string, f: ListFilters) {
  const where = and(
    eq(recordType.dashboardId, dashboardId),
    isNull(recordType.deletedAt),
    f.q ? like(recordType.name, `%${escapeLike(f.q)}%`) : undefined,
  );

  const order = {
    name: asc(recordType.name),
    "-name": desc(recordType.name),
    created_at: asc(recordType.createdAt),
    "-created_at": desc(recordType.createdAt),
  }[f.sort];

  const rows = await db
    .select()
    .from(recordType)
    .where(where)
    .orderBy(order, asc(recordType.id))
    .limit(f.limit)
    .offset(f.offset);

  const [totalRow] = await db
    .select({ total: count() })
    .from(recordType)
    .where(where);

  return { rows, total: totalRow?.total ?? 0 };
}
