// src/db/queries/installment-plans/read.ts
import { db } from "@/db";
import { installmentPlan } from "@/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { inDashboard } from "../utils";

/* ======
  READ
======= */

/**
 * Retrieves a single active installment plan by its ID within a dashboard.
 *
 * @param dashboardId The unique identifier of the dashboard owning the plan
 * @param id The unique identifier of the installment plan
 * @returns The installment plan details, or null
 */
export async function getInstallmentPlan(dashboardId: string, id: string) {
    const [row] = await db
        .select({
            id: installmentPlan.id,
            dashboardId: installmentPlan.dashboardId,
            registerById: installmentPlan.registerById,
            name: installmentPlan.name,
            description: installmentPlan.description,
            totalAmount: installmentPlan.totalAmount,
            totalInstallments: installmentPlan.totalInstallments,
            dueDate: installmentPlan.dueDate,
            status: installmentPlan.status,
            createdAt: installmentPlan.createdAt,
            updatedAt: installmentPlan.updatedAt,
        })
        .from(installmentPlan)
        .where(
            and(
                inDashboard(installmentPlan, dashboardId, id),
                isNull(installmentPlan.deletedAt)
            )
        )
        .limit(1);

    return row ?? null;
}

/**
 * Retrieves all active installment plans belonging to a specific dashboard.
 *
 * @param dashboardId The unique identifier of the dashboard
 * @returns An array of active installment plans ordered by creation date
 */
export async function getInstallmentPlansByDashboardId(dashboardId: string) {
    return await db
        .select({
            id: installmentPlan.id,
            dashboardId: installmentPlan.dashboardId,
            registerById: installmentPlan.registerById,
            name: installmentPlan.name,
            description: installmentPlan.description,
            totalAmount: installmentPlan.totalAmount,
            totalInstallments: installmentPlan.totalInstallments,
            dueDate: installmentPlan.dueDate,
            status: installmentPlan.status,
            createdAt: installmentPlan.createdAt,
            updatedAt: installmentPlan.updatedAt,
        })
        .from(installmentPlan)
        .where(
            and(
                eq(installmentPlan.dashboardId, sql`UUID_TO_BIN(${dashboardId})`),
                isNull(installmentPlan.deletedAt)
            )
        )
        .orderBy(desc(installmentPlan.createdAt));
}