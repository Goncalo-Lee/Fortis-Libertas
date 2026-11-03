import type { NextRequest } from "next/server";
import { getInstallmentPlan, getPlanProgress, getTagsByPlan, setInstallmentPlanTags } from "@/db/queries/installment-plans";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { ok } from "@/lib/api/responses";
import { setPlanTagsSchema } from "@/lib/api/schemas/installment-plan";
import { convertPlanTotals } from "@/lib/api/installment-plan-response";
import { serializeInstallmentPlan } from "@/lib/api/serializers/installment-plan";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string; installment_plan_id: string }> };

/** PUT /installment-plans/{id}/tags: replaces the full set of tags; returns the plan. */
export const PUT = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const p = await params;
  const dashboardId = parseUuid(p.dashboard_id);
  const id = parseUuid(p.installment_plan_id);
  const { session } = await requireDashboardRole(request, dashboardId, "editor");
  const { tag_ids } = await parseJson(request, setPlanTagsSchema);

  if (!(await setInstallmentPlanTags(dashboardId, id, tag_ids))) throw new ApiError("NOT_FOUND");

  const row = await getInstallmentPlan(dashboardId, id);
  if (!row) throw new ApiError("NOT_FOUND");
  const [tags, progress, [converted]] = await Promise.all([
    getTagsByPlan([id]),
    getPlanProgress(id),
    convertPlanTotals([row], session.user.id),
  ]);
  return ok(serializeInstallmentPlan(row, tags.get(id) ?? [], progress, converted));
});
