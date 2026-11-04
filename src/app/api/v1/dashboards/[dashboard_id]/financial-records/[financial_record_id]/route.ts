import type { NextRequest } from "next/server";
import {
  getFinancialRecord,
  softDeleteFinancialRecord,
  updateFinancialRecord,
} from "@/db/queries/financial-records";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { getMulti } from "@/lib/api/query";
import { noContent, ok } from "@/lib/api/responses";
import { presentFinancialRecords } from "@/lib/api/financial-record-response";
import {
  getFinancialRecordQuery,
  listMultiQuery,
  updateFinancialRecordSchema,
} from "@/lib/api/schemas/financial-record";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string; financial_record_id: string }> };

async function ids({ params }: Ctx) {
  const p = await params;
  return { dashboardId: parseUuid(p.dashboard_id), id: parseUuid(p.financial_record_id) };
}

async function respond(request: NextRequest, userId: string, row: NonNullable<Awaited<ReturnType<typeof getFinancialRecord>>>) {
  const { searchParams } = request.nextUrl;
  const { rate } = getFinancialRecordQuery.parse(Object.fromEntries(searchParams));
  const { include } = listMultiQuery.pick({ include: true }).parse({ include: getMulti(searchParams, "include") });

  const [data] = await presentFinancialRecords([row], userId, { rate, include });
  return ok(data);
}

export const GET = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  const { session } = await requireDashboardRole(request, dashboardId, "viewer");

  const row = await getFinancialRecord(dashboardId, id);
  if (!row) throw new ApiError("NOT_FOUND");
  return respond(request, session.user.id, row);
});

export const PATCH = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  const { session } = await requireDashboardRole(request, dashboardId, "editor");
  const input = await parseJson(request, updateFinancialRecordSchema);

  const row = await updateFinancialRecord(dashboardId, id, {
    recordTypeId: input.record_type_id,
    categoryId: input.category_id,
    paymentMethodId: input.payment_method_id,
    installmentPlanId: input.installment_plan_id,
    name: input.name,
    description: input.description,
    price: input.price,
    currency: input.currency,
    paymentDate: input.payment_date,
    status: input.status,
  });
  if (!row) throw new ApiError("NOT_FOUND");
  return respond(request, session.user.id, row);
});

export const DELETE = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "editor");

  if (!(await getFinancialRecord(dashboardId, id))) throw new ApiError("NOT_FOUND");
  await softDeleteFinancialRecord(dashboardId, id);
  return noContent();
});
