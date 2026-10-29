// src/db/queries/installment-plans/read.ts
import { db } from "@/db";
import { installmentPlan } from "@/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";

/**
 * Obtém todos os planos de prestações ativos de um dashboard.
 */
export async function getInstallmentPlansByDashboardId(dashboardId: string) {
    return db
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
                eq(installmentPlan.dashboardId, sql`UUID_TO_BIN
                (
                ${dashboardId}
                )`),
                isNull(installmentPlan.deletedAt)
            )
        )
        .orderBy(desc(installmentPlan.createdAt));
}