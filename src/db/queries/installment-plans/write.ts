import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { category, financialRecord, installmentPlan, recordTypeCategory, tagInstallmentPlan } from "@/db/schema";
import { generateId } from "@/db/types";
import { ApiError } from "@/lib/api/errors";
import { DEFAULT_CURRENCY, requireCurrencyId } from "../catalogs";
import { assertTagsInDashboard } from "../categories/relations";
import { getOrCreateProfile } from "../me/read";
import { inDashboard } from "../utils";
import { getExpensesRecordTypeId, getInstallmentPlan } from "./read";
import type { CreateInstallmentPlanInput, UpdateInstallmentPlanInput } from "./type";

/* ======
  WRITE
======= */

/** The category must exist in the dashboard and be linked to the `Expenses` record type. */
async function assertExpenseCategory(dashboardId: string, categoryId: string, expensesTypeId: string) {
  const [row] = await db
    .select({ id: category.id })
    .from(category)
    .innerJoin(recordTypeCategory, eq(recordTypeCategory.categoryId, category.id))
    .where(
      and(
        eq(category.id, categoryId),
        eq(category.dashboardId, dashboardId),
        isNull(category.deletedAt),
        eq(recordTypeCategory.recordTypeId, expensesTypeId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new ApiError("VALIDATION_ERROR", "Category not allowed.", [
      { pointer: "/category_id", message: "Must be a category of this dashboard linked to the Expenses record type." },
    ]);
  }
}

async function requireExpensesTypeId(dashboardId: string) {
  const id = await getExpensesRecordTypeId(dashboardId);
  if (!id) {
    throw new ApiError("VALIDATION_ERROR", "This dashboard has no Expenses record type.", [
      { pointer: "/category_id", message: "The dashboard has no Expenses record type." },
    ]);
  }
  return id;
}

/** Number of non-deleted records linked to a plan. */
async function countLinkedRecords(planId: string) {
  const [row] = await db
    .select({ total: count() })
    .from(financialRecord)
    .where(and(eq(financialRecord.installmentPlanId, planId), isNull(financialRecord.deletedAt)));
  return Number(row?.total ?? 0);
}

/**
 * Creates a plan. The record type is always the dashboard's `Expenses`; the currency defaults to the
 * caller's profile currency.
 *
 * @throws {ApiError} `VALIDATION_ERROR` for an unknown currency, tag or category (`/category_id` unless
 *   linked to Expenses)
 */
export async function createInstallmentPlan(dashboardId: string, userId: string, input: CreateInstallmentPlanInput) {
  const recordTypeId = await requireExpensesTypeId(dashboardId);
  await assertExpenseCategory(dashboardId, input.categoryId, recordTypeId);

  const code = input.currency ?? (await getOrCreateProfile(userId)).currency ?? DEFAULT_CURRENCY;
  const currencyId = await requireCurrencyId(code);

  const tagIds = input.tagIds ?? [];
  await assertTagsInDashboard(dashboardId, tagIds);

  const id = generateId();
  await db.transaction(async (tx) => {
    await tx.insert(installmentPlan).values({
      id,
      dashboardId,
      registerById: userId,
      name: input.name,
      description: input.description ?? null,
      categoryId: input.categoryId,
      recordTypeId,
      currencyId,
      totalAmount: input.totalAmount,
      totalInstallments: input.totalInstallments,
      dueDate: input.dueDate,
      status: input.status ?? "pending",
    });

    if (tagIds.length > 0) {
      await tx.insert(tagInstallmentPlan).values(tagIds.map((tagId) => ({ tagId, installmentPlanId: id })));
    }
  });

  return getInstallmentPlan(dashboardId, id);
}

/**
 * Updates a plan. Tags are changed with `setInstallmentPlanTags`.
 *
 * @returns The updated plan, or `null` if it does not exist
 * @throws {ApiError} `VALIDATION_ERROR` when `total_installments` is lower than the linked records, or for an
 *   unknown currency or category
 */
export async function updateInstallmentPlan(dashboardId: string, id: string, changes: UpdateInstallmentPlanInput) {
  const current = await getInstallmentPlan(dashboardId, id);
  if (!current) return null;

  if (changes.totalInstallments !== undefined && changes.totalInstallments < (await countLinkedRecords(id))) {
    throw new ApiError("VALIDATION_ERROR", "Fewer installments than linked records.", [
      { pointer: "/total_installments", message: "Cannot be lower than the number of linked records." },
    ]);
  }

  const set: Partial<typeof installmentPlan.$inferInsert> = {};
  if (changes.name !== undefined) set.name = changes.name;
  if (changes.description !== undefined) set.description = changes.description;
  if (changes.totalAmount !== undefined) set.totalAmount = changes.totalAmount;
  if (changes.totalInstallments !== undefined) set.totalInstallments = changes.totalInstallments;
  if (changes.dueDate !== undefined) set.dueDate = changes.dueDate;
  if (changes.status !== undefined) set.status = changes.status;
  if (changes.currency !== undefined) set.currencyId = await requireCurrencyId(changes.currency);
  if (changes.categoryId !== undefined) {
    await assertExpenseCategory(dashboardId, changes.categoryId, current.recordTypeId);
    set.categoryId = changes.categoryId;
  }

  if (Object.keys(set).length > 0) {
    await db
      .update(installmentPlan)
      .set({ ...set, updatedAt: new Date() })
      .where(inDashboard(installmentPlan, dashboardId, id));
  }

  return getInstallmentPlan(dashboardId, id);
}

/**
 * Replaces the full set of tags of a plan.
 *
 * @returns `false` if the plan does not exist
 * @throws {ApiError} `VALIDATION_ERROR` (`/tag_ids`) if a tag is not in the dashboard
 */
export async function setInstallmentPlanTags(dashboardId: string, id: string, tagIds: string[]) {
  if (!(await getInstallmentPlan(dashboardId, id))) return false;
  await assertTagsInDashboard(dashboardId, tagIds);

  await db.transaction(async (tx) => {
    const existing = await tx
      .select({ tagId: tagInstallmentPlan.tagId })
      .from(tagInstallmentPlan)
      .where(eq(tagInstallmentPlan.installmentPlanId, id));

    const current = new Set(existing.map((r) => r.tagId.toLowerCase()));
    const wanted = new Set(tagIds);

    const toRemove = [...current].filter((t) => !wanted.has(t));
    const toAdd = tagIds.filter((t) => !current.has(t));

    if (toRemove.length > 0) {
      await tx
        .delete(tagInstallmentPlan)
        .where(and(eq(tagInstallmentPlan.installmentPlanId, id), inArray(tagInstallmentPlan.tagId, toRemove)));
    }
    if (toAdd.length > 0) {
      await tx.insert(tagInstallmentPlan).values(toAdd.map((tagId) => ({ tagId, installmentPlanId: id })));
    }
  });

  return true;
}

/**
 * Soft-deletes a plan. With `detachRecords`, the linked records lose their `installment_plan_id` in the same
 * transaction (mirrors `SET NULL`).
 *
 * @throws {ApiError} `IN_USE` while records are linked and `detachRecords` is false
 */
export async function softDeleteInstallmentPlan(dashboardId: string, id: string, detachRecords = false) {
  if (!detachRecords && (await countLinkedRecords(id)) > 0) throw new ApiError("IN_USE");

  await db.transaction(async (tx) => {
    if (detachRecords) {
      await tx
        .update(financialRecord)
        .set({ installmentPlanId: null, updatedAt: new Date() })
        .where(eq(financialRecord.installmentPlanId, id));
    }

    await tx
      .update(installmentPlan)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(inDashboard(installmentPlan, dashboardId, id));
  });
}
