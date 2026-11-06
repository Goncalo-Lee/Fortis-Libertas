import { and, count, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import type { AnyMySqlColumn } from "drizzle-orm/mysql-core";
import { db } from "@/db";
import { category, currency, financialRecord, paymentMethod, recordType, tag, tagFinancialRecord } from "@/db/schema";
import { createConverter, todayUtc } from "@/lib/exchange";
import { addDecimal } from "@/lib/exchange/decimal";
import type { GroupRow, ReportGroupBy, SummaryReport, SummaryReportOptions } from "./type";

/* ======
  READ
======= */

// Day of the payment as "YYYY-MM-DD". Grouping by day lets each sum be converted with the rate of that day.
const day = sql<string>`DATE_FORMAT(${financialRecord.paymentDate}, '%Y-%m-%d')`;
const total = sql<string>`SUM(${financialRecord.price})`;

/** Filters shared by every query of the report: the dashboard, the period, the statuses and no deleted rows. */
function reportWhere(dashboardId: string, options: SummaryReportOptions) {
  return and(
    eq(financialRecord.dashboardId, dashboardId),
    isNull(financialRecord.deletedAt),
    gte(financialRecord.paymentDate, options.from),
    lte(financialRecord.paymentDate, options.to),
    inArray(financialRecord.status, options.statuses),
  );
}

/**
 * Sums the records per (currency, day), without any dimension.
 * Used for the report `total` and, cut to `YYYY-MM`, for `group_by=month`.
 */
async function sumByDay(dashboardId: string, options: SummaryReportOptions) {
  return db
    .select({ currency: currency.code, day, total, count: count() })
    .from(financialRecord)
    .innerJoin(currency, eq(currency.id, financialRecord.currencyId))
    .where(reportWhere(dashboardId, options))
    .groupBy(currency.code, day);
}

/**
 * Sums the records per (group, currency, day) for a dimension that lives in another table.
 *
 * The key and label come from the joined table. For `tag`, a record with several tags appears once per tag,
 * and a record without tags is in no group (endpoints.md, section 16.3).
 */
async function sumByDimension(
  dashboardId: string,
  options: SummaryReportOptions,
  groupBy: Exclude<ReportGroupBy, "month">,
): Promise<GroupRow[]> {
  const where = reportWhere(dashboardId, options);

  // Same columns for every dimension; only the column used as key and the one used as label change.
  const select = (key: AnyMySqlColumn, label: AnyMySqlColumn) =>
    db
      .select({ key, label, currency: currency.code, day, total, count: count() })
      .from(financialRecord)
      .innerJoin(currency, eq(currency.id, financialRecord.currencyId))
      .$dynamic();

  let rows;
  switch (groupBy) {
    case "record_type":
      rows = await select(recordType.id, recordType.name)
        .innerJoin(recordType, eq(recordType.id, financialRecord.recordTypeId))
        .where(where)
        .groupBy(recordType.id, recordType.name, currency.code, day);
      break;

    case "category":
      rows = await select(category.id, category.name)
        .innerJoin(category, eq(category.id, financialRecord.categoryId))
        .where(where)
        .groupBy(category.id, category.name, currency.code, day);
      break;

    case "payment_method":
      rows = await select(paymentMethod.id, paymentMethod.name)
        .innerJoin(paymentMethod, eq(paymentMethod.id, financialRecord.paymentMethodId))
        .where(where)
        .groupBy(paymentMethod.id, paymentMethod.name, currency.code, day);
      break;

    case "tag":
      // Two joins: record -> link table -> tag. Soft-deleted tags are left out of the groups.
      rows = await select(tag.id, tag.name)
        .innerJoin(tagFinancialRecord, eq(tagFinancialRecord.recordId, financialRecord.id))
        .innerJoin(tag, eq(tag.id, tagFinancialRecord.tagId))
        .where(and(where, isNull(tag.deletedAt)))
        .groupBy(tag.id, tag.name, currency.code, day);
      break;
  }

  // The key and label columns are typed generically above, so the values are turned into strings here.
  return rows.map((row) => ({ ...row, key: String(row.key), label: String(row.label) }));
}

/**
 * Summary report of a dashboard: totals of its records over a period, grouped by a dimension and expressed
 * in one currency (endpoints.md, section 16).
 *
 * Steps:
 * 1. Sum the records in the database per (group, currency, day), so few rows come back however many records exist.
 * 2. Convert each sum into `options.currency` with the rate of its day (or the latest one for `rate=current`).
 * 3. Add the converted sums of each group in TypeScript, with decimal strings to avoid floating-point errors.
 *
 * A sum whose rate is unavailable is left out, the same way the dashboard balance does (Open Item 14).
 */
export async function getSummaryReport(dashboardId: string, options: SummaryReportOptions): Promise<SummaryReport> {
  const toTarget = createAmountConverter(options.currency, options.rate);

  // The total is computed from the records themselves, never from the groups:
  // with group_by=tag a record can be in several groups, so their sum could exceed the real total.
  const dayRows = await sumByDay(dashboardId, options);

  const groupRows: GroupRow[] =
    options.groupBy === "month"
      ? dayRows.map((row) => ({ ...row, key: row.day.slice(0, 7), label: row.day.slice(0, 7) }))
      : await sumByDimension(dashboardId, options, options.groupBy);

  // Add up each group. A Map keeps one accumulator per key.
  const groups = new Map<string, { key: string; label: string; total: string; count: number }>();
  for (const row of groupRows) {
    const amount = await toTarget(String(row.total), row.currency, row.day);
    if (amount === null) continue;

    const group = groups.get(row.key) ?? { key: row.key, label: row.label, total: "0.00", count: 0 };
    group.total = addDecimal(group.total, amount);
    group.count += Number(row.count);
    groups.set(row.key, group);
  }

  let reportTotal = "0.00";
  for (const row of dayRows) {
    const amount = await toTarget(String(row.total), row.currency, row.day);
    if (amount !== null) reportTotal = addDecimal(reportTotal, amount);
  }

  // Months in chronological order; every other dimension with the largest total first.
  const sorted = [...groups.values()].sort((a, b) =>
    options.groupBy === "month" ? a.key.localeCompare(b.key) : Number(b.total) - Number(a.total),
  );

  return {
    period: { from: options.from.toISOString(), to: options.to.toISOString() },
    currency: options.currency,
    groups: sorted,
    total: reportTotal,
  };
}

/**
 * Returns a function that turns an amount into `target`, or `null` when no rate is available.
 * Amounts already in `target` pass through unchanged. Rates are memoised by `createConverter`,
 * so each (currency, day) pair is looked up only once per request.
 */
function createAmountConverter(target: string, rate: SummaryReportOptions["rate"]) {
  const convert = createConverter(target);
  const today = todayUtc();

  return async (amount: string, from: string, day: string): Promise<string | null> => {
    if (from === target) return amount;
    // Today's and future dates have no definitive rate yet, so they use the latest one (same rule as the balance).
    const date = rate === "current" || day >= today ? "current" : day;
    return (await convert(amount, from, date))?.amount ?? null;
  };
}
