import type { NextRequest } from "next/server";
import {
  getCategory,
  loadCategoryExtras,
  softDeleteCategory,
  updateCategory,
} from "@/db/queries/categories";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { noContent, ok } from "@/lib/api/responses";
import { getCategoryQuery, updateCategorySchema } from "@/lib/api/schemas/category";
import { serializeCategory } from "@/lib/api/serializers/category";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string; category_id: string }> };

async function ids({ params }: Ctx) {
  const p = await params;
  return { dashboardId: parseUuid(p.dashboard_id), id: parseUuid(p.category_id) };
}

export const GET = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "viewer");

  const { include } = getCategoryQuery.parse(Object.fromEntries(request.nextUrl.searchParams));

  const row = await getCategory(dashboardId, id);
  if (!row) throw new ApiError("NOT_FOUND");

  const extras = await loadCategoryExtras([row.id], include === "tags");
  return ok(serializeCategory(row, extras.recordTypesOf(row.id), extras.tagsOf?.(row.id)));
});

export const PATCH = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "editor");

  const input = await parseJson(request, updateCategorySchema);
  const row = await updateCategory(dashboardId, id, {
    name: input.name,
    description: input.description,
    colorId: input.color_id,
    iconId: input.icon_id,
  });
  if (!row) throw new ApiError("NOT_FOUND");

  const extras = await loadCategoryExtras([row.id], false);
  return ok(serializeCategory(row, extras.recordTypesOf(row.id)));
});

export const DELETE = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "editor");

  if (!(await getCategory(dashboardId, id))) throw new ApiError("NOT_FOUND");
  await softDeleteCategory(dashboardId, id);
  return noContent();
});
