import type { NextRequest } from "next/server";
import { createFinancialRecord, listFinancialRecords } from "@/db/queries/financial-records";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { parsePagination } from "@/lib/api/pagination";
import { getMulti } from "@/lib/api/query";
import { created, paginated } from "@/lib/api/responses";
import { presentFinancialRecords } from "@/lib/api/financial-record-response";
import {
  createFinancialRecordSchema,
  listFinancialRecordsQuery,
  listMultiQuery,
} from "@/lib/api/schemas/financial-record";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string }> };

export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const dashboardId = parseUuid((await params).dashboard_id);
  const { session } = await requireDashboardRole(request, dashboardId, "viewer");

  const { searchParams } = request.nextUrl;
  const { page, perPage, offset } = parsePagination(searchParams);
  const f = listFinancialRecordsQuery.parse(Object.fromEntries(searchParams));
  const multi = listMultiQuery.parse({
    record_type_id: getMulti(searchParams, "record_type_id"),
    category_id: getMulti(searchParams, "category_id"),
    payment_method_id: getMulti(searchParams, "payment_method_id"),
    tag_id: getMulti(searchParams, "tag_id"),
    status: getMulti(searchParams, "status"),
    include: getMulti(searchParams, "include"),
  });

  const { rows, total } = await listFinancialRecords(dashboardId, {
    recordTypeIds: multi.record_type_id,
    categoryIds: multi.category_id,
    paymentMethodIds: multi.payment_method_id,
    installmentPlanId: f.installment_plan_id,
    registerById: f.register_by_id,
    tagIds: multi.tag_id,
    tagMatch: f.tag_match,
    status: multi.status,
    currency: f.currency,
    paymentDateFrom: f.payment_date_from,
    paymentDateTo: f.payment_date_to,
    minPrice: f.min_price,
    maxPrice: f.max_price,
    q: f.q,
    sort: f.sort,
    limit: perPage,
    offset,
  });

  const data = await presentFinancialRecords(rows, session.user.id, { rate: f.rate, include: multi.include });
  return paginated(data, { page, perPage, total });
});

export const POST = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const dashboardId = parseUuid((await params).dashboard_id);
  const { session } = await requireDashboardRole(request, dashboardId, "editor");
  const input = await parseJson(request, createFinancialRecordSchema);

  const row = await createFinancialRecord(dashboardId, session.user.id, {
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
    tagIds: input.tag_ids,
  });
  if (!row) throw new ApiError("INTERNAL_ERROR");

  const [data] = await presentFinancialRecords([row], session.user.id);
  return created(data, `/api/v1/dashboards/${dashboardId}/financial-records/${row.id}`);
});
