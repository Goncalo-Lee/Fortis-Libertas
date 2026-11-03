import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  category,
  financialRecord,
  installmentPlan,
  paymentMethod,
  recordType,
  recordTypeCategory,
  tag,
  tagFinancialRecord,
} from "@/db/schema";
import { generateId } from "@/db/types";
import { ApiError } from "@/lib/api/errors";
import { DEFAULT_CURRENCY, requireCurrencyId } from "../catalogs";
import { assertTagsInDashboard } from "../categories/relations";
import { getOrCreateProfile } from "../me/read";
import { inDashboard } from "../utils";
import { getFinancialRecord } from "./read";
import type { CreateFinancialRecordInput, UpdateFinancialRecordInput } from "./type";

/* ======
  WRITE
======= */

function invalid(pointer: string, message: string): never {
  throw new ApiError("VALIDATION_ERROR", message, [{ pointer, message }]);
}

/**
 * Every referenced record type, category, payment method and plan must exist (not deleted) in the dashboard.
 * Fields that are `undefined` are not checked; a plan set to `null` needs no check.
 *
 * @throws {ApiError} `VALIDATION_ERROR` pointing at the offending field; `PLAN_CANCELLED` for a cancelled plan
 */
async function assertRefsInDashboard(
  dashboardId: string,
  refs: { recordTypeId?: string; categoryId?: string; paymentMethodId?: string; installmentPlanId?: string | null },
) {
  const [rt, cat, pm, plan] = await Promise.all([
    refs.recordTypeId
      ? db
          .select({ id: recordType.id })
          .from(recordType)
          .where(and(eq(recordType.id, refs.recordTypeId), eq(recordType.dashboardId, dashboardId), isNull(recordType.deletedAt)))
          .limit(1)
      : null,
    refs.categoryId
      ? db
          .select({ id: category.id })
          .from(category)
          .where(and(eq(category.id, refs.categoryId), eq(category.dashboardId, dashboardId), isNull(category.deletedAt)))
          .limit(1)
      : null,
    refs.paymentMethodId
      ? db
          .select({ id: paymentMethod.id })
          .from(paymentMethod)
          .where(
            and(
              eq(paymentMethod.id, refs.paymentMethodId),
              eq(paymentMethod.dashboardId, dashboardId),
              isNull(paymentMethod.deletedAt),
            ),
          )
          .limit(1)
      : null,
    refs.installmentPlanId
      ? db
          .select({ id: installmentPlan.id, status: installmentPlan.status })
          .from(installmentPlan)
          .where(
            and(
              eq(installmentPlan.id, refs.installmentPlanId),
              eq(installmentPlan.dashboardId, dashboardId),
              isNull(installmentPlan.deletedAt),
            ),
          )
          .limit(1)
      : null,
  ]);

  if (rt && rt.length === 0) invalid("/record_type_id", "Record type not found in this dashboard.");
  if (cat && cat.length === 0) invalid("/category_id", "Category not found in this dashboard.");
  if (pm && pm.length === 0) invalid("/payment_method_id", "Payment method not found in this dashboard.");
  if (plan && plan.length === 0) invalid("/installment_plan_id", "Installment plan not found in this dashboard.");
  if (plan?.[0]?.status === "cancelled") throw new ApiError("PLAN_CANCELLED");
}

/** The category must be linked to the record type. */
async function assertCategoryLinked(recordTypeId: string, categoryId: string) {
  const [row] = await db
    .select({ categoryId: recordTypeCategory.categoryId })
    .from(recordTypeCategory)
    .where(and(eq(recordTypeCategory.recordTypeId, recordTypeId), eq(recordTypeCategory.categoryId, categoryId)))
    .limit(1);

  if (!row) invalid("/category_id", "Category is not linked to this record type.");
}

/**
 * Creates a record (and its tags) in one transaction. `register_by_id` is the caller; the currency defaults to
 * the caller's profile currency.
 *
 * @throws {ApiError} `VALIDATION_ERROR` for an unknown reference, tag or currency, or a category not linked to
 *   the record type; `PLAN_CANCELLED` for a cancelled plan
 */
export async function createFinancialRecord(dashboardId: string, userId: string, input: CreateFinancialRecordInput) {
  await assertRefsInDashboard(dashboardId, input);
  await assertCategoryLinked(input.recordTypeId, input.categoryId);

  const tagIds = input.tagIds ?? [];
  await assertTagsInDashboard(dashboardId, tagIds);

  const code = input.currency ?? (await getOrCreateProfile(userId)).currency ?? DEFAULT_CURRENCY;
  const currencyId = await requireCurrencyId(code);

  const id = generateId();
  await db.transaction(async (tx) => {
    await tx.insert(financialRecord).values({
      id,
      dashboardId,
      registerById: userId,
      recordTypeId: input.recordTypeId,
      categoryId: input.categoryId,
      paymentMethodId: input.paymentMethodId,
      installmentPlanId: input.installmentPlanId ?? null,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      currencyId,
      paymentDate: input.paymentDate,
      status: input.status,
    });

    if (tagIds.length > 0) {
      await tx.insert(tagFinancialRecord).values(tagIds.map((tagId) => ({ tagId, recordId: id })));
    }
  });

  return getFinancialRecord(dashboardId, id);
}

/**
 * Updates a record. The resulting record type and category must still be linked. Tags are changed with the
 * tag functions below.
 *
 * @returns The updated record, or `null` if it does not exist
 */
export async function updateFinancialRecord(dashboardId: string, id: string, changes: UpdateFinancialRecordInput) {
  const current = await getFinancialRecord(dashboardId, id);
  if (!current) return null;

  await assertRefsInDashboard(dashboardId, {
    recordTypeId: changes.recordTypeId,
    categoryId: changes.categoryId,
    paymentMethodId: changes.paymentMethodId,
    installmentPlanId: changes.installmentPlanId,
  });

  if (changes.recordTypeId !== undefined || changes.categoryId !== undefined) {
    await assertCategoryLinked(changes.recordTypeId ?? current.recordTypeId, changes.categoryId ?? current.categoryId);
  }

  const set: Partial<typeof financialRecord.$inferInsert> = {};
  if (changes.recordTypeId !== undefined) set.recordTypeId = changes.recordTypeId;
  if (changes.categoryId !== undefined) set.categoryId = changes.categoryId;
  if (changes.paymentMethodId !== undefined) set.paymentMethodId = changes.paymentMethodId;
  if (changes.installmentPlanId !== undefined) set.installmentPlanId = changes.installmentPlanId;
  if (changes.name !== undefined) set.name = changes.name;
  if (changes.description !== undefined) set.description = changes.description;
  if (changes.price !== undefined) set.price = changes.price;
  if (changes.currency !== undefined) set.currencyId = await requireCurrencyId(changes.currency);
  if (changes.paymentDate !== undefined) set.paymentDate = changes.paymentDate;
  if (changes.status !== undefined) set.status = changes.status;

  if (Object.keys(set).length > 0) {
    await db
      .update(financialRecord)
      .set({ ...set, updatedAt: new Date() })
      .where(inDashboard(financialRecord, dashboardId, id));
  }

  return getFinancialRecord(dashboardId, id);
}

/** Soft-deletes a record; its `Tag__Financial_Record` rows are removed physically. */
export async function softDeleteFinancialRecord(dashboardId: string, id: string) {
  await db.transaction(async (tx) => {
    await tx.delete(tagFinancialRecord).where(eq(tagFinancialRecord.recordId, id));
    await tx
      .update(financialRecord)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(inDashboard(financialRecord, dashboardId, id));
  });
}

/**
 * Replaces the full set of tags of a record.
 *
 * @returns `false` if the record does not exist
 * @throws {ApiError} `VALIDATION_ERROR` (`/tag_ids`) if a tag is not in the dashboard
 */
export async function setFinancialRecordTags(dashboardId: string, id: string, tagIds: string[]) {
  if (!(await getFinancialRecord(dashboardId, id))) return false;
  await assertTagsInDashboard(dashboardId, tagIds);

  await db.transaction(async (tx) => {
    const existing = await tx
      .select({ tagId: tagFinancialRecord.tagId })
      .from(tagFinancialRecord)
      .where(eq(tagFinancialRecord.recordId, id));

    const current = new Set(existing.map((r) => r.tagId.toLowerCase()));
    const wanted = new Set(tagIds);

    const toRemove = [...current].filter((t) => !wanted.has(t));
    const toAdd = tagIds.filter((t) => !current.has(t));

    if (toRemove.length > 0) {
      await tx
        .delete(tagFinancialRecord)
        .where(and(eq(tagFinancialRecord.recordId, id), inArray(tagFinancialRecord.tagId, toRemove)));
    }
    if (toAdd.length > 0) {
      await tx.insert(tagFinancialRecord).values(toAdd.map((tagId) => ({ tagId, recordId: id })));
    }
  });

  return true;
}

/**
 * Adds one tag to a record (idempotent).
 *
 * @returns `"record"` or `"tag"` when that one does not exist in the dashboard, `"ok"` otherwise
 */
export async function addFinancialRecordTag(dashboardId: string, id: string, tagId: string) {
  if (!(await getFinancialRecord(dashboardId, id))) return "record" as const;

  const [found] = await db
    .select({ id: tag.id })
    .from(tag)
    .where(and(eq(tag.id, tagId), eq(tag.dashboardId, dashboardId), isNull(tag.deletedAt)))
    .limit(1);
  if (!found) return "tag" as const;

  await db.insert(tagFinancialRecord).values({ tagId, recordId: id }).onDuplicateKeyUpdate({ set: { tagId } });
  return "ok" as const;
}

/**
 * Removes one tag from a record.
 *
 * @returns `false` if the record does not exist in the dashboard
 */
export async function removeFinancialRecordTag(dashboardId: string, id: string, tagId: string) {
  if (!(await getFinancialRecord(dashboardId, id))) return false;
  await db
    .delete(tagFinancialRecord)
    .where(and(eq(tagFinancialRecord.recordId, id), eq(tagFinancialRecord.tagId, tagId)));
  return true;
}
