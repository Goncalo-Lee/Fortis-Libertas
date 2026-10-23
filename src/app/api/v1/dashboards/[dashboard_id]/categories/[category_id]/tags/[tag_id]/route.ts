import type { NextRequest } from "next/server";
import { getCategory, linkTag, unlinkTag } from "@/db/queries/categories";
import { requireDashboardRole } from "@/lib/api/access";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { noContent } from "@/lib/api/responses";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string; category_id: string; tag_id: string }> };

async function ids({ params }: Ctx) {
  const p = await params;
  return {
    dashboardId: parseUuid(p.dashboard_id),
    categoryId: parseUuid(p.category_id),
    tagId: parseUuid(p.tag_id),
  };
}

export const POST = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, categoryId, tagId } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "editor");
  if (!(await getCategory(dashboardId, categoryId))) throw new ApiError("NOT_FOUND");

  await linkTag(dashboardId, categoryId, tagId);
  return noContent();
});

export const DELETE = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, categoryId, tagId } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "editor");
  if (!(await getCategory(dashboardId, categoryId))) throw new ApiError("NOT_FOUND");

  await unlinkTag(categoryId, tagId);
  return noContent();
});
