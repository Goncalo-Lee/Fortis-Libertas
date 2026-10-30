import { and, asc, count, desc, eq, inArray, isNull, like } from "drizzle-orm";
import { db } from "@/db";
import { category, tag, tagCategory } from "@/db/schema";
import { escapeLike } from "@/db/utils";
import type { ListFiltersCategory } from "./type";
import { inDashboard } from "../utils";

/* ======
  READ
======= */

/**
 * Retrieves a single active category by its ID within a specific dashboard.
 *
 * @param dashboardId The unique identifier of the dashboard owning the category
 * @param id The unique identifier of the category
 * @returns The category record if found and not soft-deleted, or `null` otherwise
 *
 * @example
 *  const category = await getCategory("dash_123", "cat_456");
 *  if (category) {
 *    console.log(`Category found: ${category.name}`);
 *  } else {
 *    console.log("Category not found or soft-deleted.");
 *  }
 */
export async function getCategory(dashboardId: string, id: string) {
  const [row] = await db
      .select()
      .from(category)
      .where(inDashboard(category, dashboardId, id))
      .limit(1);

  return row ?? null;
}

/**
 * Lists active categories of a dashboard with optional search, tag filter, sorting, pagination,
 * and embedding of associated tags.
 *
 * Filters are combined with AND. `q` performs a partial match on the name, and `tagId` keeps only
 * categories linked to that tag. Results are sorted by the requested field, with `id` as a
 * tie-breaker so pagination stays stable.
 *
 * @param dashboardId The unique identifier of the dashboard to list categories from
 * @param f Filters, sort order and pagination options (see `ListFiltersCategory`)
 * @returns The current page of `rows` and the `total` number of matching categories
 *
 * @example
 *  const { rows, total } = await listCategories("dash_123", {
 *    q: "food",
 *    sort: "-created_at",
 *    limit: 20,
 *    offset: 0,
 *    includeTags: true,
 *  });
 *  console.log(`Showing ${rows.length} of ${total} categories.`);
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
                  .select({id: tagCategory.categoryId})
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

  const [totalRow] = await db.select({total: count()}).from(category).where(where);

  if (!f.includeTags || rows.length === 0) {
    return {rows, total: totalRow?.total ?? 0};
  }

  const categoryIds = rows.map((r) => r.id);
  const tagRows = await db
      .select({
        categoryId: tagCategory.categoryId,
        id: tag.id,
        name: tag.name,
        description: tag.description,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      })
      .from(tagCategory)
      .innerJoin(tag, eq(tagCategory.tagId, tag.id))
      .where(
          and(
              inArray(tagCategory.categoryId, categoryIds),
              isNull(tag.deletedAt)
          )
      );

  const tagsByCategoryId = new Map<string, Array<Omit<typeof tagRows[number], "categoryId">>>();
  for (const t of tagRows) {
    const list = tagsByCategoryId.get(t.categoryId) ?? [];
    list.push({
      id: t.id,
      name: t.name,
      description: t.description,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    });
    tagsByCategoryId.set(t.categoryId, list);
  }

  const rowsWithTags = rows.map((cat) => ({
    ...cat,
    tags: tagsByCategoryId.get(cat.id) ?? [],
  }));

  return {rows: rowsWithTags, total: totalRow?.total ?? 0};
}
