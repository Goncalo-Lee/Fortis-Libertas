import type { NextRequest } from "next/server";
import { listFinancialRecords } from "@/db/queries/financial-records";
import { getInstallmentPlan } from "@/db/queries/installment-plans";
import { requireDashboardRole } from "@/lib/api/access";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { parsePagination } from "@/lib/api/pagination";
import { presentFinancialRecords } from "@/lib/api/financial-record-response";
import { paginated } from "@/lib/api/responses";
import { rateMode } from "@/lib/api/schemas/financial-record";
import { z } from "zod";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string; installment_plan_id: string }> };

const query = z.looseObject({
  rate: rateMode,
  sort: z
    .enum(["payment_date", "-payment_date", "price", "-price", "name", "-name", "created_at", "-created_at"])
    .default("payment_date"),
});

/** GET /installment-plans/{id}/financial-records: records of the plan, oldest payment first by default. */
export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const p = await params;
  const dashboardId = parseUuid(p.dashboard_id);
  const planId = parseUuid(p.installment_plan_id);
  const { session } = await requireDashboardRole(request, dashboardId, "viewer");

  if (!(await getInstallmentPlan(dashboardId, planId))) throw new ApiError("NOT_FOUND");

  const { searchParams } = request.nextUrl;
  const { page, perPage, offset } = parsePagination(searchParams);
  const { rate, sort } = query.parse(Object.fromEntries(searchParams));

  const { rows, total } = await listFinancialRecords(dashboardId, {
    installmentPlanId: planId,
    sort,
    limit: perPage,
    offset,
  });

  const data = await presentFinancialRecords(rows, session.user.id, { rate });
  return paginated(data, { page, perPage, total });
});
