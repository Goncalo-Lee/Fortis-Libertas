import type { NextRequest } from "next/server";
import { getRecordType, softDeleteRecordType, updateRecordType } from "@/db/queries/record-types";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { noContent, ok } from "@/lib/api/responses";
import { updateRecordTypeSchema } from "@/lib/api/schemas/record-type";
import { serializeRecordType } from "@/lib/api/serializers/record-type";

export const runtime = "nodejs"

type Ctx = { params: Promise<{ dashboard_id: string; record_type_id: string }> }

async function ids({ params }: Ctx) {
  const p = await params;
  return { dashboardId: parseUuid(p.dashboard_id), id: parseUuid(p.record_type_id) };
}

export const GET = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "viewer");

  const row = await getRecordType(dashboardId, id);

  if (!row) throw new ApiError("NOT_FOUND");

  return ok(serializeRecordType(row));
});

export const PATCH = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "owner");

  const changes = await parseJson(request, updateRecordTypeSchema);
  const row = await updateRecordType(dashboardId, id, changes);

  if (!row) throw new ApiError("NOT_FOUND");

  return ok(serializeRecordType(row));
});

export const DELETE = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "owner");

  if (!(await getRecordType(dashboardId, id))) throw new ApiError("NOT_FOUND");

  await softDeleteRecordType(dashboardId, id);

  return noContent();
});
