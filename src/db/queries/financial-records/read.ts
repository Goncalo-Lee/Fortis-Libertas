// src/db/queries/financial-records/read.ts
import { db } from "@/db";
import {
    financialRecord,
    recordType,
    category,
    paymentMethod,
    installmentPlan,
    tagFinancialRecord,
    tag,
} from "@/db/schema";
import { eq, and, isNull, desc, sql, inArray } from "drizzle-orm";
import { inDashboard } from "../utils";

/* ======
  READ
======= */

/**
 * Retrieves a single active financial record by its ID within a dashboard,
 * including its classification metadata and tags.
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

    if (!row) return null;

    // Fetch associated tags (Section 15.2: always included as { tag_id, name })
    const tags = await db
        .select({
            tagId: tag.id,
            name: tag.name,
        })
        .from(tagFinancialRecord)
        .innerJoin(tag, eq(tagFinancialRecord.tagId, tag.id))
        .where(
            and(
                eq(tagFinancialRecord.recordId, sql`UUID_TO_BIN(${id})`),
                isNull(tag.deletedAt)
            )
        );

    return {
        ...row,
        tags,
    };
}

/**
 * Retrieves all active financial records belonging to a specific dashboard.
 */
export async function getFinancialRecordsByDashboardId(dashboardId: string) {
    const rows = await db
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

    if (rows.length === 0) return [];

    const recordIds = rows.map((r) => r.id);
    const tagRows = await db
        .select({
            recordId: tagFinancialRecord.recordId,
            tagId: tag.id,
            name: tag.name,
        })
        .from(tagFinancialRecord)
        .innerJoin(tag, eq(tagFinancialRecord.tagId, tag.id))
        .where(
            and(
                inArray(tagFinancialRecord.recordId, recordIds),
                isNull(tag.deletedAt)
            )
        );

    const tagsByRecordId = new Map<string, Array<{ tagId: string; name: string }>>();
    for (const t of tagRows) {
        const list = tagsByRecordId.get(t.recordId) ?? [];
        list.push({ tagId: t.tagId, name: t.name });
        tagsByRecordId.set(t.recordId, list);
    }

    return rows.map((rec) => ({
        ...rec,
        tags: tagsByRecordId.get(rec.id) ?? [],
    }));
}

/**
 * Lists all active financial records associated with an installment plan.
 */
export async function getRecordsByInstallmentPlanId(dashboardId: string, installmentPlanId: string) {
    return db
        .select({
            id: financialRecord.id,
            name: financialRecord.name,
            price: financialRecord.price,
            currency: financialRecord.currency,
            paymentDate: financialRecord.paymentDate,
            status: financialRecord.status,
        })
        .from(financialRecord)
        .where(
            and(
                eq(financialRecord.dashboardId, sql`UUID_TO_BIN
                (
                ${dashboardId}
                )`),
                eq(financialRecord.installmentPlanId, sql`UUID_TO_BIN
                (
                ${installmentPlanId}
                )`),
                isNull(financialRecord.deletedAt)
            )
        );
}