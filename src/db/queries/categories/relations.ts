import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../..";
import { tag, tagCategory } from "../../schema";
import { ApiError } from "../../../lib/api/errors";

/* ======
  RELATION
======= */

/**
 * Ensures every given tag ID exists, is not soft-deleted, and belongs to the dashboard.
 *
 * @param dashboardId - The unique identifier of the dashboard the tags must belong to
 * @param tagIds - The tag IDs to validate. An empty array passes without querying the database
 * @returns Nothing. Resolves when all tags are valid
 * @throws {ApiError} `VALIDATION_ERROR` listing the unknown tag IDs in `/tag_ids`
 *
 * @example
 * await assertTagsInDashboard("dash_123", ["tag_456", "tag_789"]);
 */
export async function assertTagsInDashboard(dashboardId: string, tagIds: string[]) {
  if (tagIds.length === 0) return;
  const rows = await db
    .select({ id: tag.id })
    .from(tag)
    .where(and(eq(tag.dashboardId, dashboardId), isNull(tag.deletedAt), inArray(tag.id, tagIds)));
  const found = new Set(rows.map((r) => r.id.toLowerCase()));
  const missing = tagIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new ApiError("VALIDATION_ERROR", "Some tags do not exist in this dashboard.", [
      { pointer: "/tag_ids", detail: `Unknown tag ids: ${missing.join(", ")}` },
    ]);
  }
}

/**
 * Retrieves the active tags linked to each of the given categories.
 *
 * Soft-deleted tags are excluded. Tags are ordered by name.
 *
 * @param categoryIds - The category IDs to load tags for
 * @returns A map keyed by lowercase category ID, whose values are the linked tag records.
 *   Categories without tags are absent from the map
 *
 * @example
 * const tagsByCategory = await getTagsByCategory(["cat_456", "cat_789"]);
 * const tags = tagsByCategory.get("cat_456") ?? [];
 */
export async function getTagsByCategory(categoryIds: string[]) {
  const map = new Map<string, (typeof tag.$inferSelect)[]>();
  if (categoryIds.length === 0) return map;

  const rows = await db
    .select({ categoryId: tagCategory.categoryId, tag })
    .from(tagCategory)
    .innerJoin(tag, eq(tag.id, tagCategory.tagId))
    .where(and(inArray(tagCategory.categoryId, categoryIds), isNull(tag.deletedAt)))
    .orderBy(asc(tag.name));

  for (const r of rows) {
    const key = r.categoryId.toLowerCase();
    map.set(key, [...(map.get(key) ?? []), r.tag]);
  }
  return map;
}

/**
 * Lists the active tags linked to a single category.
 *
 * @param categoryId - The unique identifier of the category
 * @returns The linked tag records ordered by name, or an empty array if there are none
 *
 * @example
 * const tags = await listCategoryTags("cat_456");
 * console.log(`Category has ${tags.length} tags.`);
 */
export async function listCategoryTags(categoryId: string) {
  const map = await getTagsByCategory([categoryId]);
  return map.get(categoryId.toLowerCase()) ?? [];
}

/**
 * Replaces the full set of tags linked to a category.
 *
 * Computes the difference between the current and the requested tag sets, then removes the
 * tags that are no longer wanted and adds the new ones, all in one transaction.
 *
 * @param dashboardId - The unique identifier of the dashboard owning the category and tags
 * @param categoryId - The unique identifier of the category
 * @param tagIds - The complete, desired list of tag IDs for the category
 * @returns Nothing. Resolves once the links have been updated
 * @throws {ApiError} `VALIDATION_ERROR` if any tag does not exist in the dashboard
 *
 * @example
 * // Leaves the category with exactly these two tags.
 * await setCategoryTags("dash_123", "cat_456", ["tag_1", "tag_2"]);
 */
export async function setCategoryTags(dashboardId: string, categoryId: string, tagIds: string[]) {
  await assertTagsInDashboard(dashboardId, tagIds);

  await db.transaction(async (tx) => {
    const existing = await tx
      .select({ tagId: tagCategory.tagId })
      .from(tagCategory)
      .where(eq(tagCategory.categoryId, categoryId));

    const current = new Set(existing.map((r) => r.tagId.toLowerCase()));
    const wanted = new Set(tagIds);
    const toRemove = [...current].filter((id) => !wanted.has(id));
    const toAdd = tagIds.filter((id) => !current.has(id));

    if (toRemove.length > 0) {
      await tx
        .delete(tagCategory)
        .where(and(eq(tagCategory.categoryId, categoryId), inArray(tagCategory.tagId, toRemove)));
    }
    if (toAdd.length > 0) {
      await tx.insert(tagCategory).values(toAdd.map((tagId) => ({ categoryId, tagId })));
    }
  });
}

/**
 * Links a single tag to a category. The operation is idempotent.
 *
 * Linking a tag that is already linked does nothing and does not raise an error.
 *
 * @param dashboardId - The unique identifier of the dashboard owning the category and tag
 * @param categoryId - The unique identifier of the category
 * @param tagId - The unique identifier of the tag to link
 * @returns Nothing. Resolves once the link exists
 * @throws {ApiError} `NOT_FOUND` if the tag does not exist, is soft-deleted, or is outside the dashboard
 *
 * @example
 * await linkTag("dash_123", "cat_456", "tag_789");
 */
export async function linkTag(dashboardId: string, categoryId: string, tagId: string) {
  const [found] = await db
    .select({ id: tag.id })
    .from(tag)
    .where(and(eq(tag.dashboardId, dashboardId), eq(tag.id, tagId), isNull(tag.deletedAt)))
    .limit(1);
  if (!found) throw new ApiError("NOT_FOUND");

  await db.insert(tagCategory).ignore().values({ categoryId, tagId });
}

/**
 * Removes the link between a tag and a category.
 *
 * Unlinking a tag that is not linked does nothing and does not raise an error.
 *
 * @param categoryId - The unique identifier of the category
 * @param tagId - The unique identifier of the tag to unlink
 * @returns Nothing. Resolves once the link has been removed
 *
 * @example
 * await unlinkTag("cat_456", "tag_789");
 */
export async function unlinkTag(categoryId: string, tagId: string) {
  await db
    .delete(tagCategory)
    .where(and(eq(tagCategory.categoryId, categoryId), eq(tagCategory.tagId, tagId)));
}
