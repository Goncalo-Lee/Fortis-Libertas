import { and, asc, count, desc, eq, inArray, isNull, like } from "drizzle-orm";
import { db } from "@/db";
import { category, recordTypeCategory, tagCategory } from "@/db/schema";
import { escapeLike } from "@/db/utils";
import { attachColorIcon } from "../catalogs";
import { inDashboard } from "../utils";
import type { ListFiltersCategory } from "./type";

/* ======
  READ
======= */

/**
 * Retrieves a single active category of a dashboard, with its color and icon.
 *
 * @returns The category, or `null` when it does not exist, is soft-deleted or belongs to another dashboard
 */
export async function getCategory(dashboardId: string, id: string) {
  const [row] = await db
    .select()
    .from(category)
    .where(inDashboard(category, dashboardId, id))
    .limit(1);

  if (!row) return null;

  const [full] = await attachColorIcon([row]);
  return full ?? null;
}

/**
 * Lists the active categories of a dashboard.
 *
 * Filters are combined with AND: `q` matches the name, `tagId` keeps categories linked to that tag and
 * `recordTypeId` keeps categories usable with that record type. `id` is the sort tie-breaker so
 * pagination stays stable.
 *
 * @returns The current page of `rows` (with color and icon) and the `total` of matching categories
 */
export async function listCategories(dashboardId: string, f: ListFiltersCategory) {
  const where = and(
    eq(category.dashboardId, dashboardId),
    isNull(category.deletedAt),
    f.q ? like(category.name, `%${escapeLike(f.q)}%`) : undefined,
    f.tagId
      ? inArray(
          category.id,
          db.select({ id: tagCategory.categoryId }).from(tagCategory).where(eq(tagCategory.tagId, f.tagId)),
        )
      : undefined,
    f.recordTypeId
      ? inArray(
          category.id,
          db
            .select({ id: recordTypeCategory.categoryId })
            .from(recordTypeCategory)
            .where(eq(recordTypeCategory.recordTypeId, f.recordTypeId)),
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

  return { rows: await attachColorIcon(rows), total: totalRow?.total ?? 0 };
}
