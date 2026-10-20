import type { NextRequest } from "next/server";
import { getCategory, listCategoryTags, setCategoryTags } from "@/db/queries/categories";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { ok } from "@/lib/api/responses";
import { setCategoryTagsSchema } from "@/lib/api/schemas/category";
import { serializeTag } from "@/lib/api/serializers/tag";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string; category_id: string }> };

async function ids({ params }: Ctx) {
  const p = await params;
  return { dashboardId: parseUuid(p.dashboard_id), id: parseUuid(p.category_id) };
}

export const GET = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "viewer");
  if (!(await getCategory(dashboardId, id))) throw new ApiError("NOT_FOUND");

  return ok((await listCategoryTags(id)).map((t) => serializeTag(t)));
});

export const PUT = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "editor");
  if (!(await getCategory(dashboardId, id))) throw new ApiError("NOT_FOUND");

  const { tag_ids } = await parseJson(request, setCategoryTagsSchema);
  await setCategoryTags(dashboardId, id, tag_ids);
  return ok((await listCategoryTags(id)).map((t) => serializeTag(t)));
});
