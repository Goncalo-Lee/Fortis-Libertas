import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../..";
import { financialRecord, installmentPlan, recordType, recordTypeCategory, tag, tagCategory } from "../../schema";
import { attachColorIcon } from "../catalogs";
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
      { pointer: "/tag_ids", message: `Unknown tag ids: ${missing.join(", ")}` },
    ]);
  }
}

/**
 * Ensures a non-empty list of record type IDs exists, is not soft-deleted, and belongs to the dashboard.
 *
 * @param dashboardId - The unique identifier of the dashboard the record types must belong to
 * @param recordTypeIds - The record type IDs to validate. Must contain at least one
 * @throws {ApiError} `VALIDATION_ERROR` pointing at `/record_type_ids` when empty or when some are unknown
 *
 * @example
 * await assertRecordTypesInDashboard("dash_123", ["rt_1", "rt_2"]);
 */
export async function assertRecordTypesInDashboard(dashboardId: string, recordTypeIds: string[]) {
  if (recordTypeIds.length === 0) {
    throw new ApiError("VALIDATION_ERROR", "One or more fields are invalid.", [
      { pointer: "/record_type_ids", message: "At least one record type is required." },
    ]);
  }

  const rows = await db
    .select({ id: recordType.id })
    .from(recordType)
    .where(
      and(
        eq(recordType.dashboardId, dashboardId),
        isNull(recordType.deletedAt),
        inArray(recordType.id, recordTypeIds),
      ),
    );

  const found = new Set(rows.map((r) => r.id.toLowerCase()));
  const missing = recordTypeIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new ApiError("VALIDATION_ERROR", "Some record types do not exist in this dashboard.", [
      { pointer: "/record_type_ids", message: `Unknown record type ids: ${missing.join(", ")}` },
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

/* ===================
  RECORD TYPE LINKS
==================== */

type RecordTypeRow = typeof recordType.$inferSelect;
type WithCatalogs<T> = Awaited<ReturnType<typeof attachColorIcon<T & { colorId: string; iconId: string }>>>[number];

/**
 * Retrieves the active record types linked to each of the given categories, with color and icon.
 * Ordered by name. Categories without links are absent from the map (keys are lowercase ids).
 */
export async function getRecordTypesByCategory(categoryIds: string[]) {
  const map = new Map<string, WithCatalogs<RecordTypeRow>[]>();
  if (categoryIds.length === 0) return map;

  const rows = await db
    .select({ categoryId: recordTypeCategory.categoryId, recordType })
    .from(recordTypeCategory)
    .innerJoin(recordType, eq(recordType.id, recordTypeCategory.recordTypeId))
    .where(and(inArray(recordTypeCategory.categoryId, categoryIds), isNull(recordType.deletedAt)))
    .orderBy(asc(recordType.name));

  const full = await attachColorIcon(rows.map((r) => r.recordType));

  rows.forEach((r, i) => {
    const key = r.categoryId.toLowerCase();
    map.set(key, [...(map.get(key) ?? []), full[i]!]);
  });
  return map;
}

/** Lists the active record types linked to one category. */
export async function listCategoryRecordTypes(categoryId: string) {
  const map = await getRecordTypesByCategory([categoryId]);
  return map.get(categoryId.toLowerCase()) ?? [];
}

/**
 * Loads what a category response needs besides the row itself: its record types (always) and its tags
 * (only when requested). Returns lookup functions by category id.
 */
export async function loadCategoryExtras(categoryIds: string[], includeTags: boolean) {
  const [recordTypes, tags] = await Promise.all([
    getRecordTypesByCategory(categoryIds),
    includeTags ? getTagsByCategory(categoryIds) : Promise.resolve(null),
  ]);

  return {
    recordTypesOf: (id: string) => recordTypes.get(id.toLowerCase()) ?? [],
    tagsOf: tags ? (id: string) => tags.get(id.toLowerCase()) ?? [] : undefined,
  };
}

/**
 * Throws `409 IN_USE` when a non-deleted financial record or installment plan uses the
 * `(record type, category)` pair of any of the given record types.
 */
async function assertLinksUnused(categoryId: string, recordTypeIds: string[]) {
  if (recordTypeIds.length === 0) return;

  const [record] = await db
    .select({ id: financialRecord.id })
    .from(financialRecord)
    .where(
      and(
        eq(financialRecord.categoryId, categoryId),
        inArray(financialRecord.recordTypeId, recordTypeIds),
        isNull(financialRecord.deletedAt),
      ),
    )
    .limit(1);
  if (record) throw new ApiError("IN_USE", "A financial record uses this record type with this category.");

  const [plan] = await db
    .select({ id: installmentPlan.id })
    .from(installmentPlan)
    .where(
      and(
        eq(installmentPlan.categoryId, categoryId),
        inArray(installmentPlan.recordTypeId, recordTypeIds),
        isNull(installmentPlan.deletedAt),
      ),
    )
    .limit(1);
  if (plan) throw new ApiError("IN_USE", "An installment plan uses this record type with this category.");
}

/**
 * Replaces the full set of record types of a category in one transaction.
 *
 * @throws {ApiError} `VALIDATION_ERROR` when the list is empty or has unknown record types;
 *   `IN_USE` when a removed link is still used by a record or plan
 */
export async function setCategoryRecordTypes(dashboardId: string, categoryId: string, recordTypeIds: string[]) {
  await assertRecordTypesInDashboard(dashboardId, recordTypeIds);

  await db.transaction(async (tx) => {
    const existing = await tx
      .select({ recordTypeId: recordTypeCategory.recordTypeId })
      .from(recordTypeCategory)
      .where(eq(recordTypeCategory.categoryId, categoryId));

    const current = new Set(existing.map((r) => r.recordTypeId.toLowerCase()));
    const wanted = new Set(recordTypeIds);
    const toRemove = [...current].filter((id) => !wanted.has(id));
    const toAdd = recordTypeIds.filter((id) => !current.has(id));

    await assertLinksUnused(categoryId, toRemove);

    if (toRemove.length > 0) {
      await tx
        .delete(recordTypeCategory)
        .where(and(eq(recordTypeCategory.categoryId, categoryId), inArray(recordTypeCategory.recordTypeId, toRemove)));
    }
    if (toAdd.length > 0) {
      await tx.insert(recordTypeCategory).values(toAdd.map((recordTypeId) => ({ recordTypeId, categoryId })));
    }
  });
}

/** Links one record type to a category (idempotent). `NOT_FOUND` if it is not an active record type of the dashboard. */
export async function linkRecordType(dashboardId: string, categoryId: string, recordTypeId: string) {
  const [found] = await db
    .select({ id: recordType.id })
    .from(recordType)
    .where(and(eq(recordType.dashboardId, dashboardId), eq(recordType.id, recordTypeId), isNull(recordType.deletedAt)))
    .limit(1);
  if (!found) throw new ApiError("NOT_FOUND");

  await db.insert(recordTypeCategory).ignore().values({ categoryId, recordTypeId });
}

/**
 * Removes the link between a record type and a category (idempotent).
 *
 * @throws {ApiError} `IN_USE` while a record or plan uses the pair; `VALIDATION_ERROR` when it is the
 *   last record type of the category
 */
export async function unlinkRecordType(categoryId: string, recordTypeId: string) {
  const existing = await db
    .select({ recordTypeId: recordTypeCategory.recordTypeId })
    .from(recordTypeCategory)
    .where(eq(recordTypeCategory.categoryId, categoryId));

  const ids = existing.map((r) => r.recordTypeId.toLowerCase());
  if (!ids.includes(recordTypeId.toLowerCase())) return;

  if (ids.length === 1) {
    throw new ApiError("VALIDATION_ERROR", "A category must stay linked to at least one record type.", [
      { pointer: "/record_type_id", message: "This is the last record type of the category." },
    ]);
  }

  await assertLinksUnused(categoryId, [recordTypeId]);

  await db
    .delete(recordTypeCategory)
    .where(and(eq(recordTypeCategory.categoryId, categoryId), eq(recordTypeCategory.recordTypeId, recordTypeId)));
}
