import type { NextRequest } from "next/server";
import {
  getCategory,
  listCategoryTags,
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

  const tags = include === "tags" ? await listCategoryTags(id) : undefined;
  return ok(serializeCategory(row, tags));
});

export const PATCH = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "editor");

  const changes = await parseJson(request, updateCategorySchema);
  const row = await updateCategory(dashboardId, id, changes);
  if (!row) throw new ApiError("NOT_FOUND");
  return ok(serializeCategory(row));
});

export const DELETE = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "editor");

  if (!(await getCategory(dashboardId, id))) throw new ApiError("NOT_FOUND");
  await softDeleteCategory(dashboardId, id);
  return noContent();
});
