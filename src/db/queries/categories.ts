import { and, asc, count, desc, eq, inArray, isNull, like } from "drizzle-orm";
import { db } from "..";
import { category, financialRecord, tag, tagCategory } from "../schema";
import { generateId } from "../types";
import { ApiError } from "../../lib/api/errors";
import { escapeLike } from "../utils";

/**
 *
 * @param dashboardId
 * @param id
 * @returns
 */
const inDashboard = (dashboardId: string, id: string) =>
  and(eq(category.dashboardId, dashboardId), eq(category.id, id), isNull(category.deletedAt));

/**
 *
 * Soft-deleted rows count too: the unique index (dashboard_id, name) includes them.
 *
 * @param dashboardId
 * @param name
 * @param exceptId
 * @returns
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
 *
 * Every tag id must exist, be non-deleted and belong to the dashboard (422 otherwise).
 *
 * @param dashboardId
 * @param tagIds
 * @returns
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
 *
 * @param dashboardId
 * @param id
 * @returns
 */
export async function getCategory(dashboardId: string, id: string) {
  const [row] = await db.select().from(category).where(inDashboard(dashboardId, id)).limit(1);
  return row ?? null;
}

/**
 *
 */
type ListFilters = {
  q?: string;
  tagId?: string;
  sort: "name" | "-name" | "created_at" | "-created_at";
  limit: number;
  offset: number;
};

/**
 *
 * @param dashboardId
 * @param f
 * @returns
 */
export async function listCategories(dashboardId: string, f: ListFilters) {
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

/**
 *
 * Tags linked to each category (non-deleted tags only), keyed by lowercase category id.
 *
 * @param categoryIds
 * @returns
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
 *
 * @param dashboardId
 * @param input
 * @returns
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
 *
 * @param dashboardId
 * @param id
 * @param changes
 * @returns
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
 *
 * @param dashboardId
 * @param id
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

/**
 *
 * @param categoryId
 * @returns
 */
export async function listCategoryTags(categoryId: string) {
  const map = await getTagsByCategory([categoryId]);
  return map.get(categoryId.toLowerCase()) ?? [];
}

/**
 *
 * PUT: replace the full set. Computes the difference and applies it in one transaction.
 *
 * @param dashboardId
 * @param categoryId
 * @param tagIds
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
 *
 * POST: idempotent. The tag must exist in the dashboard (404 otherwise).
 *
 * @param dashboardId
 * @param categoryId
 * @param tagId
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
 *
 * @param categoryId
 * @param tagId
 */
export async function unlinkTag(categoryId: string, tagId: string) {
  await db
    .delete(tagCategory)
    .where(and(eq(tagCategory.categoryId, categoryId), eq(tagCategory.tagId, tagId)));
}
