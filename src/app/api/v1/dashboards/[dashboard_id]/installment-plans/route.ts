import type { NextRequest } from "next/server";
import { createInstallmentPlan, getTagsByPlan, listInstallmentPlans } from "@/db/queries/installment-plans";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { parsePagination } from "@/lib/api/pagination";
import { created, paginated } from "@/lib/api/responses";
import {
  createInstallmentPlanSchema,
  listInstallmentPlansQuery,
  statusListSchema,
} from "@/lib/api/schemas/installment-plan";
import { convertPlanTotals } from "@/lib/api/response/installment-plan";
import { rateMode } from "@/lib/api/schemas/financial-record";
import { serializeInstallmentPlan } from "@/lib/api/serializers/installment-plan";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string }> };

export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const dashboardId = parseUuid((await params).dashboard_id);
  const { session } = await requireDashboardRole(request, dashboardId, "viewer");

  const { searchParams } = request.nextUrl;
  const { page, perPage, offset } = parsePagination(searchParams);
  const { q, due_from, due_to, sort } = listInstallmentPlansQuery.parse(Object.fromEntries(searchParams));

  // `status` is multi-value: ?status=pending&status=late or ?status=pending,late
  const rawStatus = searchParams.getAll("status").flatMap((v) => v.split(",")).filter(Boolean);
  const status = statusListSchema.parse(rawStatus);

  const { rows, total } = await listInstallmentPlans(dashboardId, {
    q,
    status,
    dueFrom: due_from,
    dueTo: due_to,
    sort,
    limit: perPage,
    offset,
  });

  const rate = rateMode.parse(searchParams.get("rate") ?? undefined);
  const [tags, converted] = await Promise.all([
    getTagsByPlan(rows.map((r) => r.id)),
    convertPlanTotals(rows, session.user.id, rate),
  ]);
  return paginated(
    rows.map((r, i) => serializeInstallmentPlan(r, tags.get(r.id.toLowerCase()) ?? [], undefined, converted[i])),
    { page, perPage, total },
  );
});

export const POST = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const dashboardId = parseUuid((await params).dashboard_id);
  const { session } = await requireDashboardRole(request, dashboardId, "editor");
  const input = await parseJson(request, createInstallmentPlanSchema);

  const row = await createInstallmentPlan(dashboardId, session.user.id, {
    name: input.name,
    description: input.description,
    categoryId: input.category_id,
    currency: input.currency,
    tagIds: input.tag_ids,
    totalAmount: input.total_amount,
    totalInstallments: input.total_installments,
    dueDate: input.due_date,
    status: input.status,
  });
  if (!row) throw new ApiError("INTERNAL_ERROR");

  const [tags, [converted]] = await Promise.all([getTagsByPlan([row.id]), convertPlanTotals([row], session.user.id)]);
  return created(
    serializeInstallmentPlan(row, tags.get(row.id.toLowerCase()) ?? [], undefined, converted),
    `/api/v1/dashboards/${dashboardId}/installment-plans/${row.id}`,
  );
});
