import { db } from "@/db";
import { financialRecord, recordType, category, paymentMethod } from "@/db/schema";
import { and, eq, isNull, gte, lte, sql } from "drizzle-orm";

/* ======
  READ
======= */

export interface SummaryReportOptions {
    from: Date;
    to: Date;
    groupBy: "record_type" | "category" | "payment_method";
    currency?: string;
}

export async function getSummaryReport(dashboardId: string, options: SummaryReportOptions) {
    const conditions = [
        eq(financialRecord.dashboardId, sql`UUID_TO_BIN(${dashboardId})`),
        gte(financialRecord.paymentDate, options.from),
        lte(financialRecord.paymentDate, options.to),
        isNull(financialRecord.deletedAt),
    ];

    if (options.currency) {
        conditions.push(eq(financialRecord.currency, options.currency));
    }

    let groupColumn: any = financialRecord.recordTypeId;
    let labelColumn: any = recordType.name;
    let joinTable: any = recordType;
    let joinCondition: any = eq(financialRecord.recordTypeId, recordType.id);

    if (options.groupBy === "category") {
        groupColumn = financialRecord.categoryId;
        labelColumn = category.name;
        joinTable = category;
        joinCondition = eq(financialRecord.categoryId, category.id);
    } else if (options.groupBy === "payment_method") {
        groupColumn = financialRecord.paymentMethodId;
        labelColumn = paymentMethod.name;
        joinTable = paymentMethod;
        joinCondition = eq(financialRecord.paymentMethodId, paymentMethod.id);
    }

    const groups = await db
        .select({
            key: groupColumn,
            label: labelColumn,
            total: sql<string>`CAST(SUM(${financialRecord.price}) AS CHAR)`,
            count: sql<number>`CAST(COUNT(${financialRecord.id}) AS UNSIGNED)`,
        })
        .from(financialRecord)
        .leftJoin(joinTable, joinCondition)
        .where(and(...conditions))
        .groupBy(groupColumn, labelColumn);

    const totalSum = groups.reduce((acc, curr) => acc + Number(curr.total || 0), 0);

    return {
        period: { from: options.from, to: options.to },
        currency: options.currency ?? "EUR",
        groups,
        total: totalSum.toFixed(2),
    };
}