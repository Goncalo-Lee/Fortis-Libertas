// src/db/queries/installment-plans/write.ts
import { db } from "@/db";
import { installmentPlan, financialRecord } from "@/db/schema";
import { generateId } from "@/db/types";
import { ApiError } from "@/lib/api/errors";
import { inDashboard, nameTaken } from "../utils";
import { getInstallmentPlan } from "./read";
import { and, eq, isNull, sql, count } from "drizzle-orm";

export interface CreateInstallmentPlanInput {
    name: string;
    description?: string | null;
    totalAmount: string; // decimal string: "1200.00"
    totalInstallments: number;
    dueDate: string; // YYYY-MM-DD
    status?: "pending" | "paid" | "cancelled" | "late";
}

export interface UpdateInstallmentPlanInput {
    name?: string;
    description?: string | null;
    totalAmount?: string;
    totalInstallments?: number;
    dueDate?: string;
    status?: "pending" | "paid" | "cancelled" | "late";
}

/* ======
  WRITE
======= */

/**
 * Creates a new installment plan in a dashboard.
 *
 * @param dashboardId The unique identifier of the dashboard owning the plan
 * @param userId The ID of the authenticated user creating the plan
 * @param input The installment plan details
 * @returns The newly created installment plan
 * @throws {ApiError} `NAME_ALREADY_EXISTS` if a plan with the same name already exists in the dashboard
 */
export async function createInstallmentPlan(
    dashboardId: string,
    userId: string,
    input: CreateInstallmentPlanInput
) {
    if (await nameTaken({ table: installmentPlan, dashboardId, name: input.name })) {
        throw new ApiError("NAME_ALREADY_EXISTS");
    }

    const id = generateId();

    try {
        await db.insert(installmentPlan).values({
            id,
            dashboardId: sql`UUID_TO_BIN(${dashboardId})`,
            registerById: sql`UUID_TO_BIN(${userId})`,
            name: input.name,
            description: input.description ?? null,
            totalAmount: input.totalAmount,
            totalInstallments: input.totalInstallments,
            dueDate: input.dueDate,
            status: input.status ?? "pending",
        });
    } catch (error) {
        if (await nameTaken({ table: installmentPlan, dashboardId, name: input.name, exceptId: id })) {
            throw new ApiError("NAME_ALREADY_EXISTS");
        }
        throw error;
    }

    return getInstallmentPlan(dashboardId, id);
}

/**
 * Updates an existing installment plan.
 * Validates that total_installments is not lower than the number of linked non-deleted records.
 *
 * @param dashboardId The dashboard identifier
 * @param id The installment plan identifier
 * @param changes The fields to modify
 * @returns The updated installment plan, or null if not found
 * @throws {ApiError} `NAME_ALREADY_EXISTS` or `VALIDATION_ERROR`
 */
export async function updateInstallmentPlan(
    dashboardId: string,
    id: string,
    changes: UpdateInstallmentPlanInput
) {
    const current = await getInstallmentPlan(dashboardId, id);
    if (!current) return null;

    // Validation per Section 14.4: total_installments cannot be lower than linked non-deleted records
    if (changes.totalInstallments !== undefined) {
        const [linkedCount] = await db
            .select({ count: count() })
            .from(financialRecord)
            .where(
                and(
                    eq(financialRecord.installmentPlanId, sql`UUID_TO_BIN(${id})`),
                    isNull(financialRecord.deletedAt)
                )
            );

        if (changes.totalInstallments < Number(linkedCount?.count ?? 0)) {
            throw new ApiError("VALIDATION_ERROR");
        }
    }

    const set: Partial<typeof installmentPlan.$inferInsert> = {};
    if (changes.name !== undefined && changes.name !== current.name) set.name = changes.name;
    if (changes.description !== undefined) set.description = changes.description;
    if (changes.totalAmount !== undefined) set.totalAmount = changes.totalAmount;
    if (changes.totalInstallments !== undefined) set.totalInstallments = changes.totalInstallments;
    if (changes.dueDate !== undefined) set.dueDate = changes.dueDate;
    if (changes.status !== undefined) set.status = changes.status;

    if (set.name !== undefined && (await nameTaken({ table: installmentPlan, dashboardId, name: set.name, exceptId: id }))) {
        throw new ApiError("NAME_ALREADY_EXISTS");
    }

    if (Object.keys(set).length > 0) {
        try {
            await db
                .update(installmentPlan)
                .set({ ...set, updatedAt: new Date() })
                .where(inDashboard(installmentPlan, dashboardId, id));
        } catch (error) {
            if (set.name !== undefined && (await nameTaken({ table: installmentPlan, dashboardId, name: set.name, exceptId: id }))) {
                throw new ApiError("NAME_ALREADY_EXISTS");
            }
            throw error;
        }
    }

    return getInstallmentPlan(dashboardId, id);
}

/**
 * Soft-deletes an installment plan.
 * If detachRecords is true, it sets installment_plan_id = NULL on linked records.
 * Otherwise, it blocks the deletion with IN_USE if records are still linked.
 *
 * @param dashboardId The dashboard identifier
 * @param id The installment plan identifier
 * @param detachRecords Optional boolean from query param ?detach_records=true
 * @throws {ApiError} `IN_USE` if records are linked and detachRecords is not true
 */
export async function softDeleteInstallmentPlan(
    dashboardId: string,
    id: string,
    detachRecords = false
) {
    const [linked] = await db
        .select({ id: financialRecord.id })
        .from(financialRecord)
        .where(
            and(
                eq(financialRecord.installmentPlanId, sql`UUID_TO_BIN(${id})`),
                isNull(financialRecord.deletedAt)
            )
        )
        .limit(1);

    if (linked && !detachRecords) {
        throw new ApiError("IN_USE");
    }

    await db.transaction(async (tx) => {
        if (detachRecords) {
            await tx
                .update(financialRecord)
                .set({ installmentPlanId: null, updatedAt: new Date() })
                .where(eq(financialRecord.installmentPlanId, sql`UUID_TO_BIN(${id})`));
        }

        await tx
            .update(installmentPlan)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(inDashboard(installmentPlan, dashboardId, id));
    });
}