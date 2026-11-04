import type { NextRequest } from "next/server";
import { listColors } from "@/db/queries/catalogs";
import { requireDashboardRole } from "@/lib/api/access";
import { requireSession } from "@/lib/api/auth";
import { withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { parsePagination } from "@/lib/api/pagination";
import { paginated } from "@/lib/api/responses";
import { listColorsQuery } from "@/lib/api/schemas/catalog";
import { serializeColor } from "@/lib/api/serializers/catalog";

export const runtime = "nodejs";

export const GET = withErrors(async (request: NextRequest) => {
  await requireSession(request);

  const { searchParams } = request.nextUrl;
  const { page, perPage, offset } = parsePagination(searchParams);
  const { dashboard_id, scope, is_reserved, ...filters } = listColorsQuery.parse(
    Object.fromEntries(searchParams),
  );

  // `in_use` is only computed for a dashboard the caller belongs to (404 otherwise).
  let inUse: { scope: "record_type" | "category"; dashboardId: string } | undefined;
  if (dashboard_id && scope) {
    const dashboardId = parseUuid(dashboard_id);
    await requireDashboardRole(request, dashboardId, "viewer");
    inUse = { scope, dashboardId };
  }

  const { rows, total } = await listColors({ ...filters, isReserved: is_reserved, inUse, limit: perPage, offset });

  return paginated(
    rows.map((r) => ({
      ...serializeColor(r),
      is_reserved: r.isReserved,
      ...(r.inUse === undefined ? {} : { in_use: r.inUse }),
    })),
    { page, perPage, total },
  );
});
