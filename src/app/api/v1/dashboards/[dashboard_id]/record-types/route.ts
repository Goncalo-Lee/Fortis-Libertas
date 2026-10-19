import type { NextRequest } from "next/server";
import { createRecordType, listRecordTypes } from "@/db/queries/record-types";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { parsePagination } from "@/lib/api/pagination";
import { created, paginated } from "@/lib/api/responses";
import { createRecordTypeSchema, listRecordTypesQuery } from "@/lib/api/schemas/record-type";
import { serializeRecordType } from "@/lib/api/serializers/record-type";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string }> };

export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {

  const dashboardId = parseUuid((await params).dashboard_id);
  await requireDashboardRole(request, dashboardId, "viewer");

  const { searchParams } = request.nextUrl;
  const { page, perPage, offset } = parsePagination(searchParams);
  const filters = listRecordTypesQuery.parse(Object.fromEntries(searchParams));

  const { rows, total } = await listRecordTypes(dashboardId, { ...filters, limit: perPage, offset });

  return paginated(rows.map(serializeRecordType), { page, perPage, total });
});

export const POST = withErrors(async (request: NextRequest, { params }: Ctx) => {

  const dashboardId = parseUuid((await params).dashboard_id);
  await requireDashboardRole(request, dashboardId, "owner");

  const input = await parseJson(request, createRecordTypeSchema);
  const row = await createRecordType(dashboardId, input);

  if (!row) throw new ApiError("INTERNAL_ERROR");

  return created(
    serializeRecordType(row),
    `/api/v1/dashboards/${dashboardId}/record-types/${row.id}`
  );
});
