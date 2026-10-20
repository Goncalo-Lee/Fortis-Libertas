import { and, eq, isNull } from "drizzle-orm";
import { db } from "../..";
import { category, financialRecord, tagCategory } from "../../schema";
import { generateId } from "../../types";
import { ApiError } from "../../../lib/api/errors";
import { assertTagsInDashboard } from "./relations";
import { getCategory, inDashboard } from "./read";

/* ======
  WRITE
======= */

/**
 * Checks whether a category name is already used within a dashboard.
 *
 * Soft-deleted rows are included in the check, because the unique index `(dashboard_id, name)`
 * also covers them.
 *
 * @param dashboardId - The unique identifier of the dashboard to check
 * @param name - The category name to check
 * @param exceptId - Optional category ID to ignore, typically the category being updated
 * @returns `true` if another category already uses the name, `false` otherwise
 *
 * @example
 * if (await nameTaken("dash_123", "Groceries", "cat_456")) {
 *   throw new ApiError("NAME_ALREADY_EXISTS");
 * }
 */
async function nameTaken(dashboardId: string, name: string, exceptId?: string) {
  const rows = await db
    .select({ id: category.id })
    .from(category)
    .where(and(eq(category.dashboardId, dashboardId), eq(category.name, name)))
    .limit(2);
  return rows.some((r) => r.id.toLowerCase() !== exceptId?.toLowerCase());
}

/**
 * Creates a new category in a dashboard and optionally links it to a set of tags.
 *
 * All tag IDs are validated first, and the name must be unique within the dashboard. The category
 * and its tag links are inserted in a single transaction.
 *
 * @param dashboardId - The unique identifier of the dashboard that will own the category
 * @param input - The category data
 * @param input.name - The category name, unique within the dashboard
 * @param input.description - Optional description, defaults to `null`
 * @param input.tag_ids - Optional tag IDs to link to the new category
 * @returns The created category record, or `null` if it could not be read back
 * @throws {ApiError} `VALIDATION_ERROR` if a tag does not exist in the dashboard
 * @throws {ApiError} `NAME_ALREADY_EXISTS` if the name is already in use
 *
 * @example
 * const category = await createCategory("dash_123", {
 *   name: "Groceries",
 *   description: "Weekly shopping",
 *   tag_ids: ["tag_456"],
 * });
 */
export async function createCategory(
  dashboardId: string,
  input: { name: string; description?: string | null; tag_ids?: string[] },
) {
  const tagIds = input.tag_ids ?? [];
  await assertTagsInDashboard(dashboardId, tagIds);
  if (await nameTaken(dashboardId, input.name)) throw new ApiError("NAME_ALREADY_EXISTS");

  const id = generateId();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(category).values({
        id,
        dashboardId,
        name: input.name,
        description: input.description ?? null,
      });
      if (tagIds.length > 0) {
        await tx.insert(tagCategory).values(tagIds.map((tagId) => ({ categoryId: id, tagId })));
      }
    });
  } catch (error) {
    if (await nameTaken(dashboardId, input.name, id)) throw new ApiError("NAME_ALREADY_EXISTS");
    throw error;
  }
  return getCategory(dashboardId, id);
}

/**
 * Updates the name and/or description of an active category.
 *
 * Only fields that are provided and actually changed are written. The new name must stay unique
 * within the dashboard, and `updated_at` is refreshed whenever a field changes.
 *
 * @param dashboardId - The unique identifier of the dashboard owning the category
 * @param id - The unique identifier of the category to update
 * @param changes - Fields to update. Omitted fields are left untouched
 * @param changes.name - New category name
 * @param changes.description - New description, or `null` to clear it
 * @returns The updated category record, or `null` if the category does not exist or is soft-deleted
 * @throws {ApiError} `NAME_ALREADY_EXISTS` if the new name is already used in the dashboard
 *
 * @example
 * const updated = await updateCategory("dash_123", "cat_456", { name: "Food" });
 * if (!updated) {
 *   console.log("Category not found or soft-deleted.");
 * }
 */
export async function updateCategory(
  dashboardId: string,
  id: string,
  changes: { name?: string; description?: string | null },
) {
  const current = await getCategory(dashboardId, id);
  if (!current) return null;

  const set: Partial<typeof category.$inferInsert> = {};
  if (changes.name !== undefined && changes.name !== current.name) set.name = changes.name;
  if (changes.description !== undefined) set.description = changes.description;

  if (set.name !== undefined && (await nameTaken(dashboardId, set.name, id))) {
    throw new ApiError("NAME_ALREADY_EXISTS");
  }

  if (Object.keys(set).length > 0) {
    try {
      await db
        .update(category)
        .set({ ...set, updatedAt: new Date() })
        .where(inDashboard(dashboardId, id));
    } catch (error) {
      if (set.name !== undefined && (await nameTaken(dashboardId, set.name, id))) {
        throw new ApiError("NAME_ALREADY_EXISTS");
      }
      throw error;
    }
  }
  return getCategory(dashboardId, id);
}

/**
 * Soft-deletes a category and removes its tag links.
 *
 * The deletion is refused if any active financial record still references the category. Otherwise
 * its tag links are removed and `deleted_at` is set, both in one transaction.
 *
 * @param dashboardId - The unique identifier of the dashboard owning the category
 * @param id - The unique identifier of the category to delete
 * @returns Nothing. Resolves once the category has been soft-deleted
 * @throws {ApiError} `IN_USE` if an active financial record uses the category
 *
 * @example
 * try {
 *   await softDeleteCategory("dash_123", "cat_456");
 * } catch (error) {
 *   // Handle IN_USE: the category is still referenced by financial records.
 * }
 */
export async function softDeleteCategory(dashboardId: string, id: string) {
  const [used] = await db
    .select({ id: financialRecord.id })
    .from(financialRecord)
    .where(and(eq(financialRecord.categoryId, id), isNull(financialRecord.deletedAt)))
    .limit(1);
  if (used) throw new ApiError("IN_USE");

  await db.transaction(async (tx) => {
    await tx.delete(tagCategory).where(eq(tagCategory.categoryId, id));
    await tx
      .update(category)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(inDashboard(dashboardId, id));
  });
}
