import { and, asc, eq, isNull, inArray } from "drizzle-orm";
import { db } from "../..";
import { category, tagCategory } from "../../schema";

/* =========
  RELATIONS
========== */

/**
 * Loads the categories linked to each of the given tags (non-deleted categories only).
 * Done in a single query to avoid the N+1 problem when listing many tags.
 *
 * @param tagIds - IDs of the tags whose categories should be loaded
 * @returns A map from lowercase tag ID to its categories, sorted by category name.
 *          Tags without categories have no entry in the map.
 *
 * @example
 * const map = await getCategoriesByTag(rows.map((t) => t.id));
 * const categories = map.get(rows[0].id.toLowerCase()) ?? [];
 */
export async function getCategoriesByTag(tagIds: string[]) {
  const map = new Map<string, (typeof category.$inferSelect)[]>();

  // Avoid an `IN ()` query with an empty list
  if (tagIds.length === 0) return map;

  // One query: junction table joined with categories, ignoring soft-deleted categories
  const rows = await db
    .select({ tagId: tagCategory.tagId, category })
    .from(tagCategory)
    .innerJoin(category, eq(category.id, tagCategory.categoryId))
    .where(and(inArray(tagCategory.tagId, tagIds), isNull(category.deletedAt)))
    .orderBy(asc(category.name));

  // Group the flat rows by tag (lowercase key so lookups are case-insensitive)
  for (const r of rows) {
    const key = r.tagId.toLowerCase();
    map.set(key, [...(map.get(key) ?? []), r.category]);
  }
  return map;
}
