import type { NextRequest } from "next/server";
import {
  getInstallmentPlan,
  getPlanProgress,
  getTagsByPlan,
  softDeleteInstallmentPlan,
  updateInstallmentPlan,
} from "@/db/queries/installment-plans";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { noContent, ok } from "@/lib/api/responses";
import { deleteInstallmentPlanQuery, updateInstallmentPlanSchema } from "@/lib/api/schemas/installment-plan";
import { convertPlanTotals } from "@/lib/api/response/installment-plan";
import { rateMode } from "@/lib/api/schemas/financial-record";
import { serializeInstallmentPlan } from "@/lib/api/serializers/installment-plan";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string; installment_plan_id: string }> };

async function ids({ params }: Ctx) {
  const p = await params;
  return { dashboardId: parseUuid(p.dashboard_id), id: parseUuid(p.installment_plan_id) };
}

export const GET = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  const { session } = await requireDashboardRole(request, dashboardId, "viewer");

  const row = await getInstallmentPlan(dashboardId, id);
  if (!row) throw new ApiError("NOT_FOUND");

  const rate = rateMode.parse(request.nextUrl.searchParams.get("rate") ?? undefined);
  const [tags, progress, [converted]] = await Promise.all([
    getTagsByPlan([id]),
    getPlanProgress(id),
    convertPlanTotals([row], session.user.id, rate),
  ]);
  return ok(serializeInstallmentPlan(row, tags.get(id) ?? [], progress, converted));
});

export const PATCH = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  const { session } = await requireDashboardRole(request, dashboardId, "editor");
  const input = await parseJson(request, updateInstallmentPlanSchema);

  const row = await updateInstallmentPlan(dashboardId, id, {
    name: input.name,
    description: input.description,
    categoryId: input.category_id,
    currency: input.currency,
    totalAmount: input.total_amount,
    totalInstallments: input.total_installments,
    dueDate: input.due_date,
    status: input.status,
  });
  if (!row) throw new ApiError("NOT_FOUND");

  const [tags, progress, [converted]] = await Promise.all([
    getTagsByPlan([id]),
    getPlanProgress(id),
    convertPlanTotals([row], session.user.id),
  ]);
  return ok(serializeInstallmentPlan(row, tags.get(id) ?? [], progress, converted));
});

/** DELETE: 409 `IN_USE` while records are linked; `?detach_records=true` unlinks them first. */
export const DELETE = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "editor");
  const { detach_records } = deleteInstallmentPlanQuery.parse(Object.fromEntries(request.nextUrl.searchParams));

  if (!(await getInstallmentPlan(dashboardId, id))) throw new ApiError("NOT_FOUND");
  await softDeleteInstallmentPlan(dashboardId, id, detach_records ?? false);
  return noContent();
});
