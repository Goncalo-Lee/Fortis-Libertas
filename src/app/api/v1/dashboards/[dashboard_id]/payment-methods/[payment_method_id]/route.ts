import type { NextRequest } from "next/server";
import { getPaymentMethod, softDeletePaymentMethod, updatePaymentMethod } from "@/db/queries/payment-methods";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { noContent, ok } from "@/lib/api/responses";
import { updatePaymentMethodSchema } from "@/lib/api/schemas/payment-method";
import { serializePaymentMethod } from "@/lib/api/serializers/payment-method";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string; payment_method_id: string }> };

async function ids({ params }: Ctx) {
  const p = await params;
  return { dashboardId: parseUuid(p.dashboard_id), id: parseUuid(p.payment_method_id) };
}

export const GET = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "viewer");

  const row = await getPaymentMethod(dashboardId, id);
  if (!row) throw new ApiError("NOT_FOUND");
  return ok(serializePaymentMethod(row));
});

/** PATCH: the creator (editor) or a dashboard owner. Another editor gets 403. */
export const PATCH = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  const { session, role } = await requireDashboardRole(request, dashboardId, "editor");

  const current = await getPaymentMethod(dashboardId, id);
  if (!current) throw new ApiError("NOT_FOUND");
  if (role !== "owner" && current.userId !== session.user.id.toLowerCase()) throw new ApiError("FORBIDDEN");

  const input = await parseJson(request, updatePaymentMethodSchema);
  const row = await updatePaymentMethod(dashboardId, id, {
    name: input.name,
    description: input.description,
    cardId: input.card_id,
  });
  if (!row) throw new ApiError("NOT_FOUND");
  return ok(serializePaymentMethod(row));
});

/** DELETE: same rule as PATCH; 409 `IN_USE` while financial records reference it. */
export const DELETE = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id } = await ids(ctx);
  const { session, role } = await requireDashboardRole(request, dashboardId, "editor");

  const current = await getPaymentMethod(dashboardId, id);
  if (!current) throw new ApiError("NOT_FOUND");
  if (role !== "owner" && current.userId !== session.user.id.toLowerCase()) throw new ApiError("FORBIDDEN");

  await softDeletePaymentMethod(dashboardId, id);
  return noContent();
});
