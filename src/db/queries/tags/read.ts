import { and, asc, count, desc, eq, isNull, like, inArray } from "drizzle-orm";
import { db } from "../..";
import { tag, tagCategory } from "../../schema";
import { inDashboard } from "./../utils";
import { escapeLike } from "../../utils";
import { ListFiltersTag } from "./type";


/* ======
  READ
======= */

/**
 * Retrieves a single tag by its ID within a specific dashboard, ensuring it is not deleted.
 *
 * @param dashboardId - The unique identifier of the dashboard owning the tag
 * @param id - The unique identifier of the tag
 * @returns The tag record if found, or `null` if no matching active record exists
 *
 * @example
 * const tag = await getTag("dash_123", "tag_456");
 * if (tag) {
 *   console.log(`Tag found: ${tag.name}`);
 * } else {
 *   console.log("Tag not found or soft-deleted.");
 * }
 */
export async function getTag(dashboardId: string, id: string) {
  // Fetch a single non-deleted record matching dashboardId and id
  const [row] = await db
    .select()
    .from(tag)
    .where(inDashboard(tag, dashboardId, id))
    .limit(1);

  return row ?? null;
}

/**
 * Lists tags belonging to a specific dashboard with optional search, category filtering,
 * dynamic sorting, and pagination.
 *
 * @param dashboardId - The unique identifier of the dashboard owning the tags
 * @param f - Filter options including search query (`q`), `categoryId`, `sort` criteria, `limit`, and `offset`
 * @returns An object containing the array of fetched tag rows and the total count of matching records
 *
 * @example
 * // Search for tags containing "marketing" in category "cat_789", newest first
 * const result = await listTags("dash_123", {
 *   q: "marketing",
 *   categoryId: "cat_789",
 *   sort: "-created_at",
 *   limit: 10,
 *   offset: 0,
 * });
 *
 * console.log(`Found ${result.total} tags:`, result.rows);
 */
export async function listTags(dashboardId: string, f: ListFiltersTag) {
  // Build dynamic SQL WHERE conditions for filtering active dashboard tags.
  // `and()` ignores `undefined` entries, so optional filters can simply be omitted.
  const where = and(
    eq(tag.dashboardId, dashboardId),
    isNull(tag.deletedAt),
    // Fuzzy search on name if search term is provided (escaped so %, _ typed by the user stay literal)
    f.q ? like(tag.name, `%${escapeLike(f.q)}%`) : undefined,
    // Filter tags associated with a specific category ID via a subquery on the junction table
    f.categoryId
      ? inArray(
          tag.id,
          db
            .select({ id: tagCategory.tagId })
            .from(tagCategory)
            .where(eq(tagCategory.categoryId, f.categoryId)),
        )
      : undefined,
  );

  // Map sort keys to corresponding Drizzle order expressions
  const order = {
    name: asc(tag.name),
    "-name": desc(tag.name),
    created_at: asc(tag.createdAt),
    "-created_at": desc(tag.createdAt),
  }[f.sort];

  // Retrieve the requested page. `tag.id` is a tiebreaker so pagination stays stable
  // when several rows share the same name or creation date.
  const rows = await db
    .select()
    .from(tag)
    .where(where)
    .orderBy(order, asc(tag.id))
    .limit(f.limit)
    .offset(f.offset);

  // Total count of records matching the filters (ignoring limit/offset), used by the UI pager
  const [totalRow] = await db.select({ total: count() }).from(tag).where(where);

  return { rows, total: totalRow?.total ?? 0 };
}
