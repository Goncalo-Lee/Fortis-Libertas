import type { NextRequest } from "next/server";
import { getTag, softDeleteTag, updateTag } from "@/db/queries/tags";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { noContent, ok } from "@/lib/api/responses";
import { updateTagSchema } from "@/lib/api/schemas/tag";
import { serializeTag } from "@/lib/api/serializers/tag";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string; tag_id: string }> };

async function ids({ params }: Ctx) {
  const p = await params;
  return { dashboardId: parseUuid(p.dashboard_id), id: parseUuid(p.tag_id) };
}

export const GET = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "viewer");

  const row = await getTag(dashboardId, id);
  if (!row) throw new ApiError("NOT_FOUND");
  return ok(serializeTag(row));
});

export const PATCH = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "editor");

  const changes = await parseJson(request, updateTagSchema);
  const row = await updateTag(dashboardId, id, changes);
  if (!row) throw new ApiError("NOT_FOUND");
  return ok(serializeTag(row));
});

export const DELETE = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "editor");

  if (!(await getTag(dashboardId, id))) throw new ApiError("NOT_FOUND");
  await softDeleteTag(dashboardId, id);
  return noContent();
});
