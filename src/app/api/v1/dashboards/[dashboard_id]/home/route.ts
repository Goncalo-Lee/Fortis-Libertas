import type { NextRequest } from "next/server";
import { requireCurrencyId } from "@/db/queries/catalogs";
import { getDashboardBalance } from "@/db/queries/dashboards/read";
import { listFinancialRecords } from "@/db/queries/financial-records";
import { getTagsByPlan, listInstallmentPlans } from "@/db/queries/installment-plans";
import { getOrCreateProfile } from "@/db/queries/me";
import { countUnreadNotifications } from "@/db/queries/notifications";
import { listRecordTypes } from "@/db/queries/record-types";
import { getSummaryReport } from "@/db/queries/reports";
import { requireDashboardRole } from "@/lib/api/access";
import { withErrors } from "@/lib/api/errors";
import { presentFinancialRecords } from "@/lib/api/financial-record-response";
import { parseUuid } from "@/lib/api/ids";
import { ok } from "@/lib/api/responses";
import { convertPlanTotals } from "@/lib/api/response/installment-plan";
import { homeQuery, monthRange } from "@/lib/api/schemas/home";
import { RECORD_STATUSES } from "@/lib/api/schemas/report";
import { serializeColor, serializeIcon } from "@/lib/api/serializers/catalog";
import { serializeInstallmentPlan } from "@/lib/api/serializers/installment-plan";
import { todayUtc } from "@/lib/exchange";
import { DAY_MS } from "@/lib/constants";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string }> };

/** Every status except `cancelled`: what "counts" on the home screen. */
const ACTIVE_STATUSES = RECORD_STATUSES.filter((s) => s !== "cancelled");
const UPCOMING_DAYS = 30;

/** "YYYY-MM-DD" of today + `days` (UTC), for comparing with `due_date`. */
function dayPlus(days: number) {
  return new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * GET /api/v1/dashboards/{dashboard_id}/home?month=2026-11&currency=EUR
 *
 * Everything the app's home screen needs in ONE request (endpoints.md, section 18). It has no table of its own:
 * each part reuses the query of its own endpoint, so the numbers always match those endpoints.
 *
 * - balance               -> same as GET /balance (all time, `paid`/`settled`)
 * - totals                -> same as GET /reports/summary?group_by=record_type for the month, plus color and icon;
 *                            record types without records in the month appear with total "0.00"
 * - recent_records        -> 5 latest records already paid (payment_date <= now), not cancelled
 * - upcoming_installments -> `pending` plans due in the next 30 days and every `late` plan, soonest first
 * - unread_notifications  -> same as GET /me/notifications/unread-count
 *
 * The independent parts run in parallel (Promise.all), so the request takes about as long as the slowest one.
 *
 * Errors: 400 bad id, 401/403, 404 non-member, 422 bad `month` or unsupported `currency`.
 */
export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const dashboardId = parseUuid((await params).dashboard_id);
  const { session, dashboard } = await requireDashboardRole(request, dashboardId, "viewer");
  const userId = session.user.id;

  const query = homeQuery.parse(Object.fromEntries(request.nextUrl.searchParams));
  const currency = query.currency ?? (await getOrCreateProfile(userId)).currency;
  if (query.currency) await requireCurrencyId(query.currency); // 422 for an unsupported currency
  const period = monthRange(query.month);

  const [balance, report, recordTypes, recent, pending, late, unread] = await Promise.all([
    getDashboardBalance(dashboardId, currency),
    getSummaryReport(dashboardId, {
      from: period.from,
      to: period.to,
      groupBy: "record_type",
      statuses: ACTIVE_STATUSES,
      currency,
      rate: "payment_date",
    }),
    listRecordTypes(dashboardId, { sort: "name", limit: 100, offset: 0 }),
    listFinancialRecords(dashboardId, {
      status: ACTIVE_STATUSES,
      paymentDateTo: new Date(),
      sort: "-payment_date",
      limit: 5,
      offset: 0,
    }),
    listInstallmentPlans(dashboardId, {
      status: ["pending"],
      dueFrom: todayUtc(),
      dueTo: dayPlus(UPCOMING_DAYS),
      sort: "due_date",
      limit: 20,
      offset: 0,
    }),
    listInstallmentPlans(dashboardId, { status: ["late"], sort: "due_date", limit: 20, offset: 0 }),
    countUnreadNotifications(userId),
  ]);

  // Totals: one item per record type, filled from the report (record types with no records stay at zero).
  const byType = new Map(report.groups.map((g) => [g.key.toLowerCase(), g]));
  const totals = recordTypes.rows.map((rt) => {
    const group = byType.get(String(rt.id).toLowerCase());
    return {
      record_type_id: rt.id,
      name: rt.name,
      kind: rt.kind,
      color: serializeColor(rt.color),
      icon: serializeIcon(rt.icon),
      total: group?.total ?? "0.00",
      count: group?.count ?? 0,
    };
  });

  // Late first would hide what is due soon; sorting all by due date keeps the oldest debt on top anyway.
  const plans = [...late.rows, ...pending.rows].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const [recentRecords, planTags, planTotals] = await Promise.all([
    presentFinancialRecords(recent.rows, userId),
    getTagsByPlan(plans.map((p) => p.id)),
    convertPlanTotals(plans, userId),
  ]);

  return ok({
    dashboard: { dashboard_id: dashboard.id, name: dashboard.name, is_active: dashboard.isActive },
    period: { from: period.from.toISOString(), to: period.to.toISOString() },
    currency,
    balance,
    totals,
    recent_records: recentRecords,
    upcoming_installments: plans.map((p, i) =>
      serializeInstallmentPlan(p, planTags.get(p.id.toLowerCase()) ?? [], undefined, planTotals[i]),
    ),
    unread_notifications: unread,
  });
});
