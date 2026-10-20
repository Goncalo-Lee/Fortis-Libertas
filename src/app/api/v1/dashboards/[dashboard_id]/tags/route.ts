import type { NextRequest } from "next/server";
import { createTag, listTags } from "@/db/queries/tags";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { parsePagination } from "@/lib/api/pagination";
import { created, paginated } from "@/lib/api/responses";
import { createTagSchema, listTagsQuery } from "@/lib/api/schemas/tag";
import { serializeTag } from "@/lib/api/serializers/tag";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string }> };

export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const dashboardId = parseUuid((await params).dashboard_id);
  await requireDashboardRole(request, dashboardId, "viewer");

  const { searchParams } = request.nextUrl;
  const { page, perPage, offset } = parsePagination(searchParams);
  const filters = listTagsQuery.parse(Object.fromEntries(searchParams));

  const { rows, total } = await listTags(dashboardId, { ...filters, limit: perPage, offset });
  return paginated(rows.map(serializeTag), { page, perPage, total });
});

export const POST = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const dashboardId = parseUuid((await params).dashboard_id);
  await requireDashboardRole(request, dashboardId, "editor");

  const input = await parseJson(request, createTagSchema);
  const row = await createTag(dashboardId, input);
  if (!row) throw new ApiError("INTERNAL_ERROR");

  return created(serializeTag(row), `/api/v1/dashboards/${dashboardId}/tags/${row.id}`);
});
