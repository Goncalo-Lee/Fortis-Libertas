import { db } from "../..";
import { eq } from "drizzle-orm";
import { tag, tagCategory, tagFinancialRecord } from "../../schema";
import { generateId } from "../../types";
import { ApiError } from "../../../lib/api/errors";
import { inDashboard, nameTaken, NameTakenParams } from "./../utils";
import { getTag } from "./read";

/* ========
  WRITE
========= */

/**
 * Creates a new tag within a specific dashboard after checking for name uniqueness.
 *
 * @param dashboardId - The unique identifier of the dashboard where the tag will be created
 * @param input - An object containing the tag name and an optional description
 * @returns The newly created tag record
 * @throws {ApiError} "NAME_ALREADY_EXISTS" if a tag with the same name already exists in the dashboard
 *
 * @example
 * try {
 *   const newTag = await createTag("dash_123", {
 *     name: "Urgent",
 *     description: "High priority tasks",
 *   });
 *   console.log("Tag created successfully:", newTag);
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.error("A tag with this name already exists.");
 *   }
 * }
 */
export async function createTag(
  dashboardId: string,
  input: { name: string; description?: string | null },
) {
  const nameTakenParams: NameTakenParams<typeof tag> = {
    table: tag,
    dashboardId,
    name: input.name,
  };

  // Fast path: reject duplicates before touching the database with an INSERT
  if (await nameTaken(nameTakenParams)) {
    throw new ApiError("NAME_ALREADY_EXISTS");
  }

  // Generate the ID up front so we can identify "our" row if the insert fails
  const id = generateId();

  try {
    await db.insert(tag).values({
      id,
      dashboardId,
      name: input.name,
      description: input.description ?? null,
    });
  } catch (error) {
    // Race condition: two simultaneous requests can both pass the check above,
    // but the unique index lets only one INSERT through.
    // `exceptId: id` excludes our own (failed) row, so a match means someone else took the name.
    if (await nameTaken({ table: tag, dashboardId, name: input.name, exceptId: id })) {
      throw new ApiError("NAME_ALREADY_EXISTS");
    }
    // Not a duplicate-name conflict, so it's an unexpected error: let it propagate
    throw error;
  }

  // Re-read from the database so the caller gets the stored row (defaults, timestamps, etc.)
  return getTag(dashboardId, id);
}

/**
 * Updates the name and/or description of an existing tag.
 * Only the fields present in `changes` are touched; `undefined` means "leave as is".
 *
 * @param dashboardId - The unique identifier of the dashboard owning the tag
 * @param id - The unique identifier of the tag to update
 * @param changes - Fields to change. Pass `description: null` to clear the description
 * @returns The updated tag record, or `null` if the tag doesn't exist (or is soft-deleted)
 * @throws {ApiError} "NAME_ALREADY_EXISTS" if the new name is already used by another tag in the dashboard
 *
 * @example
 * const updated = await updateTag("dash_123", "tag_456", { name: "Important" });
 * if (!updated) console.log("Tag not found");
 */
export async function updateTag(
  dashboardId: string,
  id: string,
  changes: { name?: string; description?: string | null },
) {
  // Make sure the tag exists in this dashboard before doing anything else
  const current = await getTag(dashboardId, id);
  if (!current) return null;

  // Collect only the columns that really changed
  const set: Partial<typeof tag.$inferInsert> = {};
  if (changes.name !== undefined && changes.name !== current.name) set.name = changes.name;
  if (changes.description !== undefined) set.description = changes.description;

  // Only check uniqueness when the name is actually changing (renaming to itself is fine)
  if (
    set.name !== undefined &&
    (await nameTaken({ table: tag, dashboardId, name: set.name, exceptId: id }))
  ) {
    throw new ApiError("NAME_ALREADY_EXISTS");
  }

  // Skip the UPDATE entirely when there is nothing to change
  if (Object.keys(set).length > 0) {
    try {
      await db
        .update(tag)
        .set({ ...set, updatedAt: new Date() })
        .where(inDashboard(tag, dashboardId, id));
    } catch (error) {
      // Same race condition as in createTag: another request may have taken the name
      // between our check and the UPDATE; the unique index rejects it.
      if (
        set.name !== undefined &&
        (await nameTaken({ table: tag, dashboardId, name: set.name, exceptId: id }))
      ) {
        throw new ApiError("NAME_ALREADY_EXISTS");
      }
      throw error;
    }
  }

  // Return the fresh row from the database
  return getTag(dashboardId, id);
}

/**
 * Soft-deletes a tag: the tag row is kept with `deletedAt` set, while its links to
 * categories and financial records are physically removed.
 *
 * @param dashboardId - The unique identifier of the dashboard owning the tag
 * @param id - The unique identifier of the tag to delete
 * @returns `true` if the tag was deleted, `false` if it doesn't exist in this dashboard
 *
 * @example
 * const deleted = await softDeleteTag("dash_123", "tag_456");
 * if (!deleted) console.log("Tag not found");
 */
export async function softDeleteTag(dashboardId: string, id: string) {
  return db.transaction(async (tx) => {
    // Ownership check first: without it, the junction rows below (which only filter by tagId)
    // could be wiped for a tag that belongs to a different dashboard.
    const [existing] = await tx
      .select({ id: tag.id })
      .from(tag)
      .where(inDashboard(tag, dashboardId, id))
      .limit(1);
    if (!existing) return false;

    // Junction rows have no deleted_at: remove them physically (mirrors ON DELETE CASCADE).
    await tx.delete(tagCategory).where(eq(tagCategory.tagId, id));
    await tx.delete(tagFinancialRecord).where(eq(tagFinancialRecord.tagId, id));

    // Finally mark the tag itself as deleted
    await tx
      .update(tag)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(inDashboard(tag, dashboardId, id));

    return true;
  });
}
