import { and, asc, count, desc, eq, gte, inArray, isNull, like, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { color, currency, financialRecord, installmentPlan, recordType, tag, tagInstallmentPlan } from "@/db/schema";
import { escapeLike } from "@/db/utils";
import { inDashboard } from "../utils";
import type { ListFiltersInstallmentPlan } from "./type";

/* ======
  READ
======= */

// The API shows the currency as a code; the table stores its id.
const planColumns = {
  id: installmentPlan.id,
  dashboardId: installmentPlan.dashboardId,
  registerById: installmentPlan.registerById,
  name: installmentPlan.name,
  description: installmentPlan.description,
  categoryId: installmentPlan.categoryId,
  recordTypeId: installmentPlan.recordTypeId,
  totalAmount: installmentPlan.totalAmount,
  totalInstallments: installmentPlan.totalInstallments,
  dueDate: installmentPlan.dueDate,
  status: installmentPlan.status,
  currency: currency.code,
  createdAt: installmentPlan.createdAt,
  updatedAt: installmentPlan.updatedAt,
};

/** One non-deleted plan of the dashboard (with currency code), or `null`. */
export async function getInstallmentPlan(dashboardId: string, id: string) {
  const [row] = await db
    .select(planColumns)
    .from(installmentPlan)
    .innerJoin(currency, eq(currency.id, installmentPlan.currencyId))
    .where(inDashboard(installmentPlan, dashboardId, id))
    .limit(1);
  return row ?? null;
}

/** Page of the dashboard's plans and the total. `id` breaks sort ties. */
export async function listInstallmentPlans(dashboardId: string, f: ListFiltersInstallmentPlan) {
  const where = and(
    eq(installmentPlan.dashboardId, dashboardId),
    isNull(installmentPlan.deletedAt),
    f.q
      ? or(
          like(installmentPlan.name, `%${escapeLike(f.q)}%`),
          like(installmentPlan.description, `%${escapeLike(f.q)}%`),
        )
      : undefined,
    f.status?.length ? inArray(installmentPlan.status, f.status) : undefined,
    f.dueFrom ? gte(installmentPlan.dueDate, f.dueFrom) : undefined,
    f.dueTo ? lte(installmentPlan.dueDate, f.dueTo) : undefined,
  );

  const order = {
    due_date: asc(installmentPlan.dueDate),
    "-due_date": desc(installmentPlan.dueDate),
    total_amount: asc(installmentPlan.totalAmount),
    "-total_amount": desc(installmentPlan.totalAmount),
    created_at: asc(installmentPlan.createdAt),
    "-created_at": desc(installmentPlan.createdAt),
  }[f.sort];

  const rows = await db
    .select(planColumns)
    .from(installmentPlan)
    .innerJoin(currency, eq(currency.id, installmentPlan.currencyId))
    .where(where)
    .orderBy(order, asc(installmentPlan.id))
    .limit(f.limit)
    .offset(f.offset);

  const [totalRow] = await db.select({ total: count() }).from(installmentPlan).where(where);

  return { rows, total: totalRow?.total ?? 0 };
}

/** Tags of each given plan (non-deleted tags, ordered by name), keyed by lowercase plan id. */
export async function getTagsByPlan(planIds: string[]) {
  const map = new Map<string, { id: string; name: string }[]>();
  if (planIds.length === 0) return map;

  const rows = await db
    .select({ planId: tagInstallmentPlan.installmentPlanId, id: tag.id, name: tag.name })
    .from(tagInstallmentPlan)
    .innerJoin(tag, eq(tag.id, tagInstallmentPlan.tagId))
    .where(and(inArray(tagInstallmentPlan.installmentPlanId, planIds), isNull(tag.deletedAt)))
    .orderBy(asc(tag.name));

  for (const r of rows) {
    const key = r.planId.toLowerCase();
    map.set(key, [...(map.get(key) ?? []), { id: r.id, name: r.name }]);
  }
  return map;
}

/** Number and summed `price` of the non-deleted records linked to a plan (detail endpoint). */
export async function getPlanProgress(planId: string) {
  const [row] = await db
    .select({
      recordsCount: count(),
      recordsTotal: sql<string>`COALESCE(SUM(${financialRecord.price}), 0)`,
    })
    .from(financialRecord)
    .where(and(eq(financialRecord.installmentPlanId, planId), isNull(financialRecord.deletedAt)));

  return {
    recordsCount: Number(row?.recordsCount ?? 0),
    recordsTotal: Number(row?.recordsTotal ?? 0).toFixed(2),
  };
}

/**
 * The dashboard's `Expenses` record type: the non-deleted `expense` type that uses a reserved color.
 * Identified this way so that renaming it does not break plans.
 */
export async function getExpensesRecordTypeId(dashboardId: string) {
  const [row] = await db
    .select({ id: recordType.id })
    .from(recordType)
    .innerJoin(color, eq(color.id, recordType.colorId))
    .where(
      and(
        eq(recordType.dashboardId, dashboardId),
        isNull(recordType.deletedAt),
        eq(recordType.kind, "expense"),
        eq(color.isReserved, true),
      ),
    )
    .limit(1);
  return row?.id ?? null;
}
