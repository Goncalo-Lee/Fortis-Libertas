import type { NextRequest } from "next/server";
import { createCategory, listCategories, loadCategoryExtras } from "@/db/queries/categories";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { parsePagination } from "@/lib/api/pagination";
import { created, paginated } from "@/lib/api/responses";
import { createCategorySchema, listCategoriesQuery } from "@/lib/api/schemas/category";
import { serializeCategory } from "@/lib/api/serializers/category";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string }> };

export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const dashboardId = parseUuid((await params).dashboard_id);
  await requireDashboardRole(request, dashboardId, "viewer");

  const { searchParams } = request.nextUrl;
  const { page, perPage, offset } = parsePagination(searchParams);
  const { include, tag_id, record_type_id, ...filters } = listCategoriesQuery.parse(
    Object.fromEntries(searchParams),
  );

  const { rows, total } = await listCategories(dashboardId, {
    ...filters,
    tagId: tag_id?.toLowerCase(),
    recordTypeId: record_type_id?.toLowerCase(),
    limit: perPage,
    offset,
  });

  const extras = await loadCategoryExtras(rows.map((r) => r.id), include === "tags");

  return paginated(
    rows.map((r) => serializeCategory(r, extras.recordTypesOf(r.id), extras.tagsOf?.(r.id))),
    { page, perPage, total },
  );
});

export const POST = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const dashboardId = parseUuid((await params).dashboard_id);
  await requireDashboardRole(request, dashboardId, "editor");

  const input = await parseJson(request, createCategorySchema);
  const row = await createCategory(dashboardId, {
    name: input.name,
    description: input.description,
    tagIds: input.tag_ids,
    colorId: input.color_id,
    iconId: input.icon_id,
    recordTypeIds: input.record_type_ids,
  });
  if (!row) throw new ApiError("INTERNAL_ERROR");

  const extras = await loadCategoryExtras([row.id], false);

  return created(
    serializeCategory(row, extras.recordTypesOf(row.id)),
    `/api/v1/dashboards/${dashboardId}/categories/${row.id}`,
  );
});
