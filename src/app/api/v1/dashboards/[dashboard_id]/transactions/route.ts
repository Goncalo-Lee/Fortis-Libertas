import type { NextRequest } from "next/server";
import { getOrCreateProfile } from "@/db/queries/me";
import { listTransactions } from "@/db/queries/transactions";
import { requireDashboardRole } from "@/lib/api/access";
import { withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { parsePagination } from "@/lib/api/pagination";
import { getMulti } from "@/lib/api/query";
import { paginated } from "@/lib/api/responses";
import { listTransactionsQuery, transactionMultiQuery } from "@/lib/api/schemas/transaction";
import { serializeTransaction } from "@/lib/api/serializers/transaction";
import { createConverter, toDay } from "@/lib/exchange";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string }> };

/**
 * GET /api/v1/dashboards/{dashboard_id}/transactions
 *
 * Financial history of the dashboard: one entry per financial record and installment plan, kept even after the
 * source is deleted (endpoints.md, section 20). Read-only: entries are written by the source queries.
 *
 * Pipeline:
 * 1. parseUuid            -> 400 bad id
 * 2. requireDashboardRole -> 401 / 403, 404 for non-members (viewer is enough)
 * 3. Zod                  -> 422 for a bad filter, date, `deleted`, `sort`, `rate` or `source_type`
 * 4. listTransactions     -> page + total
 * 5. convert              -> `converted` in the caller's profile currency, one rate lookup per (currency, day)
 */
export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const dashboardId = parseUuid((await params).dashboard_id);
  const { session } = await requireDashboardRole(request, dashboardId, "viewer");

  const { searchParams } = request.nextUrl;
  const { page, perPage, offset } = parsePagination(searchParams);
  const f = listTransactionsQuery.parse(Object.fromEntries(searchParams));
  const multi = transactionMultiQuery.parse({ source_type: getMulti(searchParams, "source_type") });

  const { rows, total } = await listTransactions(dashboardId, {
    sourceTypes: multi.source_type,
    recordTypeId: f.record_type_id,
    userId: f.user_id,
    occurredFrom: f.occurred_from,
    occurredTo: f.occurred_to,
    deleted: f.deleted,
    sort: f.sort,
    limit: perPage,
    offset,
  });

  // Same conversion rule as the financial records list (endpoints.md, section 1.8).
  const profile = await getOrCreateProfile(session.user.id);
  const convert = createConverter(profile.currency);

  const data = await Promise.all(
    rows.map(async (row) =>
      serializeTransaction(
        row,
        await convert(String(row.amount), row.currency, f.rate === "current" ? "current" : toDay(row.occurredAt)),
      ),
    ),
  );

  return paginated(data, { page, perPage, total });
});
