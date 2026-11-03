import { and, asc, count, desc, eq, gte, inArray, isNull, like, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  category,
  currency,
  financialRecord,
  installmentPlan,
  paymentMethod,
  recordType,
  tag,
  tagFinancialRecord,
} from "@/db/schema";
import { escapeLike } from "@/db/utils";
import { inDashboard } from "../utils";
import type { ListFiltersFinancialRecord, RecordInclude } from "./type";

/* ======
  READ
======= */

// The API shows the currency as a code; the table stores its id.
const recordColumns = {
  id: financialRecord.id,
  dashboardId: financialRecord.dashboardId,
  registerById: financialRecord.registerById,
  recordTypeId: financialRecord.recordTypeId,
  categoryId: financialRecord.categoryId,
  paymentMethodId: financialRecord.paymentMethodId,
  installmentPlanId: financialRecord.installmentPlanId,
  name: financialRecord.name,
  description: financialRecord.description,
  price: financialRecord.price,
  currency: currency.code,
  paymentDate: financialRecord.paymentDate,
  status: financialRecord.status,
  createdAt: financialRecord.createdAt,
  updatedAt: financialRecord.updatedAt,
};

/** One non-deleted record of the dashboard (with currency code), or `null`. */
export async function getFinancialRecord(dashboardId: string, id: string) {
  const [row] = await db
    .select(recordColumns)
    .from(financialRecord)
    .innerJoin(currency, eq(currency.id, financialRecord.currencyId))
    .where(inDashboard(financialRecord, dashboardId, id))
    .limit(1);
  return row ?? null;
}

/** Page of the dashboard's records and the total. `id` breaks sort ties. */
export async function listFinancialRecords(dashboardId: string, f: ListFiltersFinancialRecord) {
  // Records having ALL the tags (`all`) or at least one of them (`any`).
  let tagFilter;
  if (f.tagIds?.length) {
    const linked = db
      .select({ id: tagFinancialRecord.recordId })
      .from(tagFinancialRecord)
      .where(inArray(tagFinancialRecord.tagId, f.tagIds));

    tagFilter =
      f.tagMatch === "all"
        ? inArray(
            financialRecord.id,
            linked
              .groupBy(tagFinancialRecord.recordId)
              .having(sql`COUNT(DISTINCT ${tagFinancialRecord.tagId}) = ${f.tagIds.length}`),
          )
        : inArray(financialRecord.id, linked);
  }

  const where = and(
    eq(financialRecord.dashboardId, dashboardId),
    isNull(financialRecord.deletedAt),
    f.recordTypeIds?.length ? inArray(financialRecord.recordTypeId, f.recordTypeIds) : undefined,
    f.categoryIds?.length ? inArray(financialRecord.categoryId, f.categoryIds) : undefined,
    f.paymentMethodIds?.length ? inArray(financialRecord.paymentMethodId, f.paymentMethodIds) : undefined,
    f.installmentPlanId === "none"
      ? isNull(financialRecord.installmentPlanId)
      : f.installmentPlanId
        ? eq(financialRecord.installmentPlanId, f.installmentPlanId)
        : undefined,
    f.registerById ? eq(financialRecord.registerById, f.registerById) : undefined,
    tagFilter,
    f.status?.length ? inArray(financialRecord.status, f.status) : undefined,
    f.currency ? eq(currency.code, f.currency) : undefined,
    f.paymentDateFrom ? gte(financialRecord.paymentDate, f.paymentDateFrom) : undefined,
    f.paymentDateTo ? lte(financialRecord.paymentDate, f.paymentDateTo) : undefined,
    f.minPrice ? gte(financialRecord.price, f.minPrice) : undefined,
    f.maxPrice ? lte(financialRecord.price, f.maxPrice) : undefined,
    f.q
      ? or(
          like(financialRecord.name, `%${escapeLike(f.q)}%`),
          like(financialRecord.description, `%${escapeLike(f.q)}%`),
        )
      : undefined,
  );

  const order = {
    payment_date: asc(financialRecord.paymentDate),
    "-payment_date": desc(financialRecord.paymentDate),
    price: asc(financialRecord.price),
    "-price": desc(financialRecord.price),
    name: asc(financialRecord.name),
    "-name": desc(financialRecord.name),
    created_at: asc(financialRecord.createdAt),
    "-created_at": desc(financialRecord.createdAt),
  }[f.sort];

  const rows = await db
    .select(recordColumns)
    .from(financialRecord)
    .innerJoin(currency, eq(currency.id, financialRecord.currencyId))
    .where(where)
    .orderBy(order, asc(financialRecord.id))
    .limit(f.limit)
    .offset(f.offset);

  const [totalRow] = await db
    .select({ total: count() })
    .from(financialRecord)
    .innerJoin(currency, eq(currency.id, financialRecord.currencyId))
    .where(where);

  return { rows, total: totalRow?.total ?? 0 };
}

/** Tags of each given record (non-deleted tags, ordered by name), keyed by lowercase record id. */
export async function getTagsByRecord(recordIds: string[]) {
  const map = new Map<string, { id: string; name: string }[]>();
  if (recordIds.length === 0) return map;

  const rows = await db
    .select({ recordId: tagFinancialRecord.recordId, id: tag.id, name: tag.name })
    .from(tagFinancialRecord)
    .innerJoin(tag, eq(tag.id, tagFinancialRecord.tagId))
    .where(and(inArray(tagFinancialRecord.recordId, recordIds), isNull(tag.deletedAt)))
    .orderBy(asc(tag.name));

  for (const r of rows) {
    const key = r.recordId.toLowerCase();
    map.set(key, [...(map.get(key) ?? []), { id: r.id, name: r.name }]);
  }
  return map;
}

type Named = { id: string; name: string };
const byId = (rows: Named[]) => new Map(rows.map((r) => [r.id.toLowerCase(), r]));

/**
 * Loads the `{ id, name }` summaries asked for with `include`, for a page of records.
 * Each map is keyed by lowercase id; the ones not requested stay empty.
 */
export async function getRecordIncludes(
  rows: { recordTypeId: string; categoryId: string; paymentMethodId: string; installmentPlanId: string | null }[],
  include: Set<RecordInclude>,
) {
  const unique = (ids: (string | null)[]) => [...new Set(ids.filter((id): id is string => id !== null))];

  const [recordTypes, categories, paymentMethods, plans] = await Promise.all([
    include.has("record_type") && rows.length
      ? db
          .select({ id: recordType.id, name: recordType.name })
          .from(recordType)
          .where(inArray(recordType.id, unique(rows.map((r) => r.recordTypeId))))
      : [],
    include.has("category") && rows.length
      ? db
          .select({ id: category.id, name: category.name })
          .from(category)
          .where(inArray(category.id, unique(rows.map((r) => r.categoryId))))
      : [],
    include.has("payment_method") && rows.length
      ? db
          .select({ id: paymentMethod.id, name: paymentMethod.name })
          .from(paymentMethod)
          .where(inArray(paymentMethod.id, unique(rows.map((r) => r.paymentMethodId))))
      : [],
    include.has("installment_plan") && rows.some((r) => r.installmentPlanId)
      ? db
          .select({ id: installmentPlan.id, name: installmentPlan.name })
          .from(installmentPlan)
          .where(inArray(installmentPlan.id, unique(rows.map((r) => r.installmentPlanId))))
      : [],
  ]);

  return {
    recordTypes: byId(recordTypes),
    categories: byId(categories),
    paymentMethods: byId(paymentMethods),
    installmentPlans: byId(plans),
  };
}
