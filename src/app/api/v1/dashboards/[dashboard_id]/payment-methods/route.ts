import type { NextRequest } from "next/server";
import { createPaymentMethod, listPaymentMethods } from "@/db/queries/payment-methods";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { parsePagination } from "@/lib/api/pagination";
import { created, paginated } from "@/lib/api/responses";
import { createPaymentMethodSchema, listPaymentMethodsQuery } from "@/lib/api/schemas/payment-method";
import { serializePaymentMethod } from "@/lib/api/serializers/payment-method";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string }> };

export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const dashboardId = parseUuid((await params).dashboard_id);
  const { session } = await requireDashboardRole(request, dashboardId, "viewer");

  const { searchParams } = request.nextUrl;
  const { page, perPage, offset } = parsePagination(searchParams);
  const { q, mine, card_id, sort } = listPaymentMethodsQuery.parse(Object.fromEntries(searchParams));

  const { rows, total } = await listPaymentMethods(dashboardId, {
    q,
    userId: mine ? session.user.id : undefined,
    cardId: card_id,
    sort,
    limit: perPage,
    offset,
  });

  return paginated(rows.map(serializePaymentMethod), { page, perPage, total });
});

export const POST = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const dashboardId = parseUuid((await params).dashboard_id);
  const { session } = await requireDashboardRole(request, dashboardId, "editor");
  const input = await parseJson(request, createPaymentMethodSchema);

  const row = await createPaymentMethod(dashboardId, session.user.id, {
    name: input.name,
    description: input.description,
    cardId: input.card_id,
  });
  if (!row) throw new ApiError("INTERNAL_ERROR");

  return created(serializePaymentMethod(row), `/api/v1/dashboards/${dashboardId}/payment-methods/${row.id}`);
});
