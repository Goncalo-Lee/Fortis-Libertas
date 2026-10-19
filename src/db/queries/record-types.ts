import { and, asc, count, desc, eq, isNull, like } from "drizzle-orm";
import { db } from "..";
import { financialRecord, recordType } from "../schema";
import { generateId } from "../types";
import { ApiError } from "../../lib/api/errors";
import { escapeLike } from "../utils";

/**
 * Constructs a SQL WHERE condition to find a specific record type within a dashboard,
 * ensuring it hasn't been soft-deleted.
 *
 * Step-by-step breakdown:
 * 1. Accepts two identifiers: `dashboardId` (owner) and `id` (target record type).
 * 2. Combines three conditions using logical AND:
 *    - `eq(recordType.dashboardId, dashboardId)`: Ensures the record belongs to the specified dashboard.
 *    - `eq(recordType.id, id)`: Matches the specific record type ID.
 *    - `isNull(recordType.deletedAt)`: Filters out soft-deleted records (only active ones).
 * 3. Returns a Drizzle `SQL` fragment suitable for use in `.where()` clauses.
 *
 * Usage context:
 * - Ideal for GET/PUT/DELETE operations where ownership validation and soft-delete
 *   checks are required simultaneously.
 * - Prevents accidental access to deleted data or cross-dashboard data leakage.
 *
 * @param dashboardId - The ID of the dashboard
 * @param id - The ID of recordType
 */
const inDashboard = (dashboardId: string, id: string) =>
  and(
    eq(recordType.dashboardId, dashboardId), // Ownership check
    eq(recordType.id, id),                  // Exact ID match
    isNull(recordType.deletedAt)            // Exclude soft-deleted rows
  );

/**
 * True if the name is taken in this dashboard. Soft-deleted rows count too,
 * because the unique index (dashboard_id, name) includes them.
 *
 * Step-by-step breakdown:
 * 1. Queries the `recordType` table selecting only the `id` column (lightweight).
 * 2. Filters by:
 *    - `dashboardId` match (name uniqueness is scoped per dashboard).
 *    - Exact `name` match.
 *    - NOTE: intentionally does NOT filter `deletedAt IS NULL`, because the
 *      underlying unique index covers soft-deleted rows too. Excluding them
 *      here would let a create/update pass validation and then fail at the
 *      DB level with ER_DUP_ENTRY.
 * 3. Limits to 2 rows: enough to detect a collision while avoiding fetching
 *    the whole result set.
 * 4. Returns true if ANY returned row's id differs from `exceptId`
 *    (case-insensitive comparison). `exceptId` lets an UPDATE ignore itself.
 *
 * @param dashboardId - The ID of the dashboard
 * @param name - The name of recordType
 * @param exceptId - The ID of recordType
 */
async function nameTaken(dashboardId: string, name: string, exceptId?: string) {
  const rows = await db
    // Select only the id to minimize payload
    .select({ id: recordType.id })
    .from(recordType)
    .where(
      and(
        // Scope uniqueness to the parent dashboard
        eq(recordType.dashboardId, dashboardId),
        // Match the candidate name exactly
        eq(recordType.name, name)))
    .limit(2);

  // Collision if any matching row is NOT the record being updated.
  // With exceptId undefined, any existing row => true (CREATE path).
  return rows.some((r) => r.id.toLowerCase() !== exceptId?.toLowerCase());
}

/**
 * Fetches a single record type by ID within a specific dashboard,
 * excluding soft-deleted entries.
 *
 * Step-by-step breakdown:
 * 1. Calls `inDashboard(dashboardId, id)` which builds a WHERE clause enforcing:
 *    - Ownership: `dashboardId` matches.
 *    - Identity: `id` matches.
 *    - Active status: `deletedAt` IS NULL (excludes soft-deleted rows).
 * 2. Executes the query selecting all columns (`select()`) from `recordType`.
 * 3. Limits the result to 1 row (optimization; we expect at most one match).
 * 4. Destructures the first element from the result array `[row]`.
 * 5. Returns the row object if found, or `null` if no match exists.
 *
 * @param dashboardId - The ID of the dashboard
 * @param id - The ID of recordType
 * @returns The recordType
 */
export async function getRecordType(dashboardId: string, id: string) {
  // Execute query with ownership and soft-delete filters applied
  const [row] = await db
    .select()
    .from(recordType)
    .where(inDashboard(dashboardId, id))
    .limit(1);

  // Return the row if found, otherwise null
  return row ?? null;
}

type ListFilters = {
  q?: string,
  sort: "name" | "-name" | "created_at" | "-created_at";
  limit: number;
  offset: number;
};

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

export async function createRecordType(
  dashboardId: string,
  input: { name: string; description?: string | null },
) {
  if (await nameTaken(dashboardId, input.name)) throw new ApiError("NAME_ALREADY_EXISTS");

  const id = generateId();
  try {
    await db.insert(recordType).values({
      id,
      dashboardId,
      name: input.name,
      description: input.description ?? null,
    });
  } catch (error) {
    // Two simultaneous requests can both pass the check above; the unique index stops the second.
    if (await nameTaken(dashboardId, input.name, id)) throw new ApiError("NAME_ALREADY_EXISTS");
    throw error;
  }
  return getRecordType(dashboardId, id);
}

export async function updateRecordType(
  dashboardId: string,
  id: string,
  changes: { name?: string; description?: string | null },
) {
  const current = await getRecordType(dashboardId, id);
  if (!current) return null;

  const set: Partial<typeof recordType.$inferInsert> = {};
  if (changes.name !== undefined && changes.name !== current.name) set.name = changes.name;
  if (changes.description !== undefined) set.description = changes.description;

  if (set.name !== undefined && (await nameTaken(dashboardId, set.name, id))) {
    throw new ApiError("NAME_ALREADY_EXISTS");
  }

  if (Object.keys(set).length > 0) {
    try {
      await db
        .update(recordType)
        .set({ ...set, updatedAt: new Date() })
        .where(inDashboard(dashboardId, id));
    } catch (error) {
      if (set.name !== undefined && (await nameTaken(dashboardId, set.name, id))) {
        throw new ApiError("NAME_ALREADY_EXISTS");
      }
      throw error;
    }
  }
  return getRecordType(dashboardId, id);
}

export async function softDeleteRecordType(dashboardId: string, id: string) {
  // Emulates ON DELETE RESTRICT: financial records still point to this type.
  const [used] = await db
    .select({ id: financialRecord.id })
    .from(financialRecord)
    .where(and(
      eq(financialRecord.recordTypeId, id),
      isNull(financialRecord.deletedAt)
    ))
    .limit(1);

  if (used) throw new ApiError("IN_USE");

  await db
    .update(recordType)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(inDashboard(dashboardId, id));
}
