// src/db/queries/financial-records/read.ts
import { db } from "@/db";
import {
    financialRecord,
    recordType,
    category,
    paymentMethod,
    installmentPlan
} from "@/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { inDashboard } from "../utils";

/* ======
  READ
======= */

/**
 * Retrieves a single active financial record by its ID within a dashboard,
 * including its classification metadata.
 *
 * @param dashboardId The unique identifier of the dashboard owning the record
 * @param id The unique identifier of the financial record
 * @returns The full financial record with relation details, or null
 */
export async function getFinancialRecord(dashboardId: string, id: string) {
    const [row] = await db
        .select({
            id: financialRecord.id,
            dashboardId: financialRecord.dashboardId,
            registerById: financialRecord.registerById,
            name: financialRecord.name,
            description: financialRecord.description,
            price: financialRecord.price,
            currency: financialRecord.currency,
            paymentDate: financialRecord.paymentDate,
            status: financialRecord.status,
            createdAt: financialRecord.createdAt,
            updatedAt: financialRecord.updatedAt,
            recordType: {
                id: recordType.id,
                name: recordType.name,
            },
            category: {
                id: category.id,
                name: category.name,
            },
            paymentMethod: {
                id: paymentMethod.id,
                name: paymentMethod.name,
            },
            installmentPlan: {
                id: installmentPlan.id,
                name: installmentPlan.name,
            },
        })
        .from(financialRecord)
        .leftJoin(recordType, eq(financialRecord.recordTypeId, recordType.id))
        .leftJoin(category, eq(financialRecord.categoryId, category.id))
        .leftJoin(paymentMethod, eq(financialRecord.paymentMethodId, paymentMethod.id))
        .leftJoin(installmentPlan, eq(financialRecord.installmentPlanId, installmentPlan.id))
        .where(
            and(
                inDashboard(financialRecord, dashboardId, id),
                isNull(financialRecord.deletedAt)
            )
        )
        .limit(1);

    return row ?? null;
}

/**
 * Retrieves all active financial records belonging to a specific dashboard,
 * sorted chronologically by payment date descending.
 *
 * @param dashboardId The unique identifier of the dashboard
 * @returns An array of enriched financial records
 */
export async function getFinancialRecordsByDashboardId(dashboardId: string) {
    return await db
        .select({
            id: financialRecord.id,
            dashboardId: financialRecord.dashboardId,
            registerById: financialRecord.registerById,
            name: financialRecord.name,
            description: financialRecord.description,
            price: financialRecord.price,
            currency: financialRecord.currency,
            paymentDate: financialRecord.paymentDate,
            status: financialRecord.status,
            createdAt: financialRecord.createdAt,
            updatedAt: financialRecord.updatedAt,
            recordType: {
                id: recordType.id,
                name: recordType.name,
            },
            category: {
                id: category.id,
                name: category.name,
            },
            paymentMethod: {
                id: paymentMethod.id,
                name: paymentMethod.name,
            },
            installmentPlan: {
                id: installmentPlan.id,
                name: installmentPlan.name,
            },
        })
        .from(financialRecord)
        .leftJoin(recordType, eq(financialRecord.recordTypeId, recordType.id))
        .leftJoin(category, eq(financialRecord.categoryId, category.id))
        .leftJoin(paymentMethod, eq(financialRecord.paymentMethodId, paymentMethod.id))
        .leftJoin(installmentPlan, eq(financialRecord.installmentPlanId, installmentPlan.id))
        .where(
            and(
                eq(financialRecord.dashboardId, sql`UUID_TO_BIN(${dashboardId})`),
                isNull(financialRecord.deletedAt)
            )
        )
        .orderBy(desc(financialRecord.paymentDate));
}