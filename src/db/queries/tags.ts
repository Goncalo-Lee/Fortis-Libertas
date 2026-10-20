import { and, asc, count, desc, eq, isNull, like, inArray } from "drizzle-orm";
import { db } from "..";
import { tag, category ,tagCategory, tagFinancialRecord } from "../schema";
import { generateId } from "../types";
import { ApiError } from "../../lib/api/errors";
import { escapeLike } from "../utils";

/* =========
  TYPES
========== */

type ListFilters = {
  q?: string;
  categoryId?: string;
  sort: "name" | "-name" | "created_at" | "-created_at";
  limit: number;
  offset: number;
};

/* =========
  FUNCTIONS
========== */

const inDashboard = (dashboardId: string, id: string) =>
  and(eq(tag.dashboardId, dashboardId), eq(tag.id, id), isNull(tag.deletedAt));


/**
 * Soft-deleted rows count too: the unique index (dashboard_id, name) includes them.
 */
async function nameTaken(dashboardId: string, name: string, exceptId?: string) {
  const rows = await db
    .select({ id: tag.id })
    .from(tag)
    .where(and(eq(tag.dashboardId, dashboardId), eq(tag.name, name)))
    .limit(2);
  return rows.some((r) => r.id.toLowerCase() !== exceptId?.toLowerCase());
}

export async function getTag(dashboardId: string, id: string) {
  const [row] = await db.select().from(tag).where(inDashboard(dashboardId, id)).limit(1);
  return row ?? null;
}

export async function listTags(dashboardId: string, f: ListFilters) {
  const where = and(
    eq(tag.dashboardId, dashboardId),
    isNull(tag.deletedAt),
    f.q ? like(tag.name, `%${escapeLike(f.q)}%`) : undefined,
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

  const order = {
    name: asc(tag.name),
    "-name": desc(tag.name),
    created_at: asc(tag.createdAt),
    "-created_at": desc(tag.createdAt),
  }[f.sort];

  const rows = await db
    .select()
    .from(tag)
    .where(where)
    .orderBy(order, asc(tag.id))
    .limit(f.limit)
    .offset(f.offset);

  const [totalRow] = await db.select({ total: count() }).from(tag).where(where);
  return { rows, total: totalRow?.total ?? 0 };
}

export async function createTag(
  dashboardId: string,
  input: { name: string; description?: string | null },
) {
  if (await nameTaken(dashboardId, input.name)) throw new ApiError("NAME_ALREADY_EXISTS");

  const id = generateId();
  try {
    await db.insert(tag).values({
      id,
      dashboardId,
      name: input.name,
      description: input.description ?? null,
    });
  } catch (error) {
    // Two simultaneous requests can pass the check above; the unique index stops the second.
    if (await nameTaken(dashboardId, input.name, id)) throw new ApiError("NAME_ALREADY_EXISTS");
    throw error;
  }
  return getTag(dashboardId, id);
}

export async function updateTag(
  dashboardId: string,
  id: string,
  changes: { name?: string; description?: string | null },
) {
  const current = await getTag(dashboardId, id);
  if (!current) return null;

  const set: Partial<typeof tag.$inferInsert> = {};
  if (changes.name !== undefined && changes.name !== current.name) set.name = changes.name;
  if (changes.description !== undefined) set.description = changes.description;

  if (set.name !== undefined && (await nameTaken(dashboardId, set.name, id))) {
    throw new ApiError("NAME_ALREADY_EXISTS");
  }

  if (Object.keys(set).length > 0) {
    try {
      await db
        .update(tag)
        .set({ ...set, updatedAt: new Date() })
        .where(inDashboard(dashboardId, id));
    } catch (error) {
      if (set.name !== undefined && (await nameTaken(dashboardId, set.name, id))) {
        throw new ApiError("NAME_ALREADY_EXISTS");
      }
      throw error;
    }
  }
  return getTag(dashboardId, id);
}

export async function softDeleteTag(dashboardId: string, id: string) {
  await db.transaction(async (tx) => {
    // Junction rows have no deleted_at: remove them physically (mirrors ON DELETE CASCADE).
    await tx.delete(tagCategory).where(eq(tagCategory.tagId, id));
    await tx.delete(tagFinancialRecord).where(eq(tagFinancialRecord.tagId, id));
    await tx
      .update(tag)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(inDashboard(dashboardId, id));
  });
}

/**
 *
 * Categories linked to each tag (non-deleted only), keyed by lowercase tag id.
 *
 * @param tagIds
 * @returns
 */
export async function getCategoriesByTag(tagIds: string[]) {
  const map = new Map<string, (typeof category.$inferSelect)[]>();
  if (tagIds.length === 0) return map;

  const rows = await db
    .select({ tagId: tagCategory.tagId, category })
    .from(tagCategory)
    .innerJoin(category, eq(category.id, tagCategory.categoryId))
    .where(and(inArray(tagCategory.tagId, tagIds), isNull(category.deletedAt)))
    .orderBy(asc(category.name));

  for (const r of rows) {
    const key = r.tagId.toLowerCase();
    map.set(key, [...(map.get(key) ?? []), r.category]);
  }
  return map;
}
