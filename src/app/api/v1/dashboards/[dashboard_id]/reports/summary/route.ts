import type { NextRequest } from "next/server";
import { requireCurrencyId } from "@/db/queries/catalogs";
import { getOrCreateProfile } from "@/db/queries/me";
import { getSummaryReport } from "@/db/queries/reports";
import { requireDashboardRole } from "@/lib/api/access";
import { withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { getMulti } from "@/lib/api/query";
import { ok } from "@/lib/api/responses";
import { reportStatusQuery, summaryReportQuery } from "@/lib/api/schemas/report";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string }> };

/**
 * GET /dashboards/{dashboard_id}/reports/summary
 *
 * Totals of the dashboard's records over a period, grouped by record type, category, tag, payment method
 * or month, and converted into one currency (endpoints.md, section 16).
 *
 * Pipeline:
 * 1. parseUuid            -> 400 if the id is not a UUID
 * 2. requireDashboardRole -> 401/403 without a valid session, 404 if the caller is not a member (viewer is enough)
 * 3. Zod                  -> 422 for a missing/invalid date, a period over 366 days, or an unknown status/group_by
 * 4. currency             -> the one asked for (422 if unsupported) or, by default, the caller's profile currency
 * 5. getSummaryReport     -> sums, conversion and grouping
 */
export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const dashboardId = parseUuid((await params).dashboard_id);
  const { session } = await requireDashboardRole(request, dashboardId, "viewer");

  const searchParams = request.nextUrl.searchParams;
  const query = summaryReportQuery.parse(Object.fromEntries(searchParams));
  const { status } = reportStatusQuery.parse({ status: getMulti(searchParams, "status") });

  const code = query.currency ?? (await getOrCreateProfile(session.user.id)).currency;
  if (query.currency) await requireCurrencyId(query.currency); // 422 for an unsupported currency

  const report = await getSummaryReport(dashboardId, {
    from: query.payment_date_from,
    to: query.payment_date_to,
    groupBy: query.group_by,
    statuses: status,
    currency: code,
    rate: query.rate,
  });

  return ok(report);
});
