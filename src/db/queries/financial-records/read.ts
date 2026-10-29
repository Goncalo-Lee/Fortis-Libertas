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

/**
 * Obtém todos os registos financeiros ativos de um dashboard,
 * acompanhados pelas respetivas classificações associadas.
 */
export async function getFinancialRecordsByDashboardId(dashboardId: string) {
    return db
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
            // Dados relacionais enriquecidos
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
        .leftJoin(
            recordType,
            eq(financialRecord.recordTypeId, recordType.id)
        )
        .leftJoin(
            category,
            eq(financialRecord.categoryId, category.id)
        )
        .leftJoin(
            paymentMethod,
            eq(financialRecord.paymentMethodId, paymentMethod.id)
        )
        .leftJoin(
            installmentPlan,
            eq(financialRecord.installmentPlanId, installmentPlan.id)
        )
        .where(
            and(
                eq(financialRecord.dashboardId, sql`UUID_TO_BIN
                (
                ${dashboardId}
                )`),
                isNull(financialRecord.deletedAt)
            )
        )
        .orderBy(desc(financialRecord.paymentDate));
}