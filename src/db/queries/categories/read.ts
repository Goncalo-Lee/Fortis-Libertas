import { and, asc, count, desc, eq, inArray, isNull, like } from "drizzle-orm";
import { db } from "../..";
import { category, tagCategory } from "../../schema";
import { escapeLike } from "../../utils";
import type { ListFiltersCategory } from "./type";

/* ======
  READ
======= */

/**
 * Builds a condition that matches a single active (non-deleted) category within a dashboard.
 *
 * Shared with `write.ts`. It is not re-exported from `index.ts`.
 *
 * @param dashboardId - The unique identifier of the dashboard owning the category
 * @param id - The unique identifier of the category
 * @returns A Drizzle condition checking the dashboard, the category ID and that `deleted_at` is null
 *
 * @example
 * const [row] = await db
 *   .select()
 *   .from(category)
 *   .where(inDashboard("dash_123", "cat_456"))
 *   .limit(1);
 */
export const inDashboard = (dashboardId: string, id: string) =>
  and(eq(category.dashboardId, dashboardId), eq(category.id, id), isNull(category.deletedAt));

/**
 * Retrieves a single active category by its ID within a specific dashboard.
 *
 * @param dashboardId - The unique identifier of the dashboard owning the category
 * @param id - The unique identifier of the category
 * @returns The category record if found and not soft-deleted, or `null` otherwise
 *
 * @example
 * const category = await getCategory("dash_123", "cat_456");
 * if (category) {
 *   console.log(`Category found: ${category.name}`);
 * } else {
 *   console.log("Category not found or soft-deleted.");
 * }
 */
export async function getCategory(dashboardId: string, id: string) {
  const [row] = await db.select().from(category).where(inDashboard(dashboardId, id)).limit(1);
  return row ?? null;
}

/**
 * Lists active categories of a dashboard with optional search, tag filter, sorting and pagination.
 *
 * Filters are combined with AND. `q` performs a partial match on the name, and `tagId` keeps only
 * categories linked to that tag. Results are sorted by the requested field, with `id` as a
 * tie-breaker so pagination stays stable.
 *
 * @param dashboardId - The unique identifier of the dashboard to list categories from
 * @param f - Filters, sort order and pagination options (see `ListFilters`)
 * @returns The current page of `rows` and the `total` number of matching categories
 *
 * @example
 * const { rows, total } = await listCategories("dash_123", {
 *   q: "food",
 *   sort: "-created_at",
 *   limit: 20,
 *   offset: 0,
 * });
 * console.log(`Showing ${rows.length} of ${total} categories.`);
 */
export async function listCategories(dashboardId: string, f: ListFiltersCategory) {
  const where = and(
    eq(category.dashboardId, dashboardId),
    isNull(category.deletedAt),
    f.q ? like(category.name, `%${escapeLike(f.q)}%`) : undefined,
    f.tagId
      ? inArray(
          category.id,
          db
            .select({ id: tagCategory.categoryId })
            .from(tagCategory)
            .where(eq(tagCategory.tagId, f.tagId)),
        )
      : undefined,
  );

  const order = {
    name: asc(category.name),
    "-name": desc(category.name),
    created_at: asc(category.createdAt),
    "-created_at": desc(category.createdAt),
  }[f.sort];

  const rows = await db
    .select()
    .from(category)
    .where(where)
    .orderBy(order, asc(category.id))
    .limit(f.limit)
    .offset(f.offset);

  const [totalRow] = await db.select({ total: count() }).from(category).where(where);
  return { rows, total: totalRow?.total ?? 0 };
}
