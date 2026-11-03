// src/db/queries/financial-records/write.ts
import { db } from "@/db";
import { financialRecord, tagFinancialRecord, installmentPlan } from "@/db/schema";
import { generateId } from "@/db/types";
import { inDashboard } from "../utils";
import { getFinancialRecord } from "./read";
import { CreateFinancialRecordInput, UpdateFinancialRecordInput } from "./type";
import { and, eq, isNull, sql } from "drizzle-orm";
import { ApiError } from "@/lib/api/errors";

/* ======
  WRITE
======= */

/**
 * Creates a new financial record with optional tags inside a dashboard.
 * Validates that linked installment plans are not cancelled.
 */
export async function createFinancialRecord(
    dashboardId: string,
    userId: string,
    input: CreateFinancialRecordInput
) {
    // Check if installment plan is cancelled per Section 15.6
    if (input.installmentPlanId) {
        const [plan] = await db
            .select({ status: installmentPlan.status })
            .from(installmentPlan)
            .where(
                and(
                    eq(installmentPlan.id, sql`UUID_TO_BIN(${input.installmentPlanId})`),
                    isNull(installmentPlan.deletedAt)
                )
            )
            .limit(1);

        if (plan?.status === "cancelled") {
            throw new ApiError("PLAN_CANCELLED");
        }
    }

    const id = generateId();

    await db.transaction(async (tx) => {
        await tx.insert(financialRecord).values({
            id,
            dashboardId: sql`UUID_TO_BIN(${dashboardId})`,
            registerById: sql`UUID_TO_BIN(${userId})`,
            recordTypeId: sql`UUID_TO_BIN(${input.recordTypeId})`,
            categoryId: sql`UUID_TO_BIN(${input.categoryId})`,
            paymentMethodId: sql`UUID_TO_BIN(${input.paymentMethodId})`,
            installmentPlanId: input.installmentPlanId
                ? sql`UUID_TO_BIN(${input.installmentPlanId})`
                : null,
            name: input.name,
            description: input.description ?? null,
            price: input.price,
            currency: input.currency ?? "EUR",
            paymentDate: input.paymentDate,
            status: input.status,
        });

        if (input.tagIds && input.tagIds.length > 0) {
            await tx.insert(tagFinancialRecord).values(
                input.tagIds.map((tagId) => ({
                    recordId: id,
                    tagId: sql`UUID_TO_BIN(${tagId})`,
                    createdAt: new Date(),
                }))
            );
        }
    });

    return getFinancialRecord(dashboardId, id);
}

/**
 * Updates an existing financial record.
 */
export async function updateFinancialRecord(
    dashboardId: string,
    id: string,
    changes: UpdateFinancialRecordInput
) {
    const current = await getFinancialRecord(dashboardId, id);
    if (!current) return null;

    if (changes.installmentPlanId) {
        const [plan] = await db
            .select({ status: installmentPlan.status })
            .from(installmentPlan)
            .where(
                and(
                    eq(installmentPlan.id, sql`UUID_TO_BIN(${changes.installmentPlanId})`),
                    isNull(installmentPlan.deletedAt)
                )
            )
            .limit(1);

        if (plan?.status === "cancelled") {
            throw new ApiError("PLAN_CANCELLED");
        }
    }

    const set: Partial<typeof financialRecord.$inferInsert> = {};
    if (changes.name !== undefined) set.name = changes.name;
    if (changes.description !== undefined) set.description = changes.description;
    if (changes.price !== undefined) set.price = changes.price;
    if (changes.currency !== undefined) set.currency = changes.currency;
    if (changes.paymentDate !== undefined) set.paymentDate = changes.paymentDate;
    if (changes.status !== undefined) set.status = changes.status;
    if (changes.recordTypeId !== undefined) set.recordTypeId = sql`UUID_TO_BIN(${changes.recordTypeId})` as any;
    if (changes.categoryId !== undefined) set.categoryId = sql`UUID_TO_BIN(${changes.categoryId})` as any;
    if (changes.paymentMethodId !== undefined) set.paymentMethodId = sql`UUID_TO_BIN(${changes.paymentMethodId})` as any;
    if (changes.installmentPlanId !== undefined) {
        set.installmentPlanId = changes.installmentPlanId ? (sql`UUID_TO_BIN(${changes.installmentPlanId})` as any) : null;
    }

    if (Object.keys(set).length > 0) {
        await db
            .update(financialRecord)
            .set({ ...set, updatedAt: new Date() })
            .where(inDashboard(financialRecord, dashboardId, id));
    }

    return getFinancialRecord(dashboardId, id);
}

/**
 * Soft-deletes a financial record and physically deletes its tag relations per Section 15.6.
 */
export async function softDeleteFinancialRecord(dashboardId: string, id: string) {
    await db.transaction(async (tx) => {
        await tx
            .delete(tagFinancialRecord)
            .where(eq(tagFinancialRecord.recordId, sql`UUID_TO_BIN(${id})`));

        await tx
            .update(financialRecord)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(inDashboard(financialRecord, dashboardId, id));
    });
}

/**
 * Replaces all tags of a financial record atomically (PUT /tags).
 */
export async function syncFinancialRecordTags(dashboardId: string, recordId: string, tagIds: string[]) {
    await db.transaction(async (tx) => {
        await tx
            .delete(tagFinancialRecord)
            .where(eq(tagFinancialRecord.recordId, sql`UUID_TO_BIN(${recordId})`));

        if (tagIds.length > 0) {
            await tx.insert(tagFinancialRecord).values(
                tagIds.map((tagId) => ({
                    recordId: sql`UUID_TO_BIN(${recordId})`,
                    tagId: sql`UUID_TO_BIN(${tagId})`,
                    createdAt: new Date(),
                }))
            );
        }
    });
}

/**
 * Links a single tag to a financial record idempotently (POST /tags/{tag_id}).
 */
export async function linkTagToFinancialRecord(dashboardId: string, recordId: string, tagId: string) {
    try {
        await db.insert(tagFinancialRecord).values({
            recordId: sql`UUID_TO_BIN(${recordId})`,
            tagId: sql`UUID_TO_BIN(${tagId})`,
            createdAt: new Date(),
        });
    } catch {
        // Idempotent insertion
    }
}

/**
 * Unlinks a single tag from a financial record (DELETE /tags/{tag_id}).
 */
export async function unlinkTagFromFinancialRecord(dashboardId: string, recordId: string, tagId: string) {
    await db
        .delete(tagFinancialRecord)
        .where(
            and(
                eq(tagFinancialRecord.recordId, sql`UUID_TO_BIN(${recordId})`),
                eq(tagFinancialRecord.tagId, sql`UUID_TO_BIN(${tagId})`)
            )
        );
}