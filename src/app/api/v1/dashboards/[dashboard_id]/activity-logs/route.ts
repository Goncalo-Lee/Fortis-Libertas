import type { NextRequest } from "next/server";
import { listActivityLogs } from "@/db/queries/activity-logs";
import { requireDashboardRole } from "@/lib/api/access";
import { withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { parsePagination } from "@/lib/api/pagination";
import { getMulti } from "@/lib/api/query";
import { paginated } from "@/lib/api/responses";
import { activityLogMultiQuery, listActivityLogsQuery } from "@/lib/api/schemas/activity-log";
import { serializeActivityLog } from "@/lib/api/serializers/activity-log";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string }> };

/**
 * GET /api/v1/dashboards/{dashboard_id}/activity-logs
 *
 * Who did what in the dashboard: its own changes, its resources and its members (endpoints.md, section 19).
 *
 * Pipeline:
 * 1. parseUuid            -> 400 bad id
 * 2. requireDashboardRole -> owner only; 403 for editors/viewers, 404 for non-members
 * 3. Zod                  -> 422 for a bad filter, date or sort
 * 4. listActivityLogs     -> page + total. `ip_address`/`user_agent` are not included (see the serializer).
 */
export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const dashboardId = parseUuid((await params).dashboard_id);
  await requireDashboardRole(request, dashboardId, "owner");

  const { searchParams } = request.nextUrl;
  const { page, perPage, offset } = parsePagination(searchParams);
  const f = listActivityLogsQuery.parse(Object.fromEntries(searchParams));
  const { action } = activityLogMultiQuery.parse({ action: getMulti(searchParams, "action") });

  const { rows, total } = await listActivityLogs(
    { scope: "dashboard", dashboardId },
    {
      actions: action,
      entityType: f.entity_type,
      userId: f.user_id,
      createdFrom: f.created_from,
      createdTo: f.created_to,
      sort: f.sort,
      limit: perPage,
      offset,
    },
  );

  return paginated(rows.map((row) => serializeActivityLog(row)), { page, perPage, total });
});
