import type { NextRequest } from "next/server";
import { addFinancialRecordTag, removeFinancialRecordTag } from "@/db/queries/financial-records";
import { requireDashboardRole } from "@/lib/api/access";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { noContent } from "@/lib/api/responses";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string; financial_record_id: string; tag_id: string }> };

async function ids({ params }: Ctx) {
  const p = await params;
  return {
    dashboardId: parseUuid(p.dashboard_id),
    id: parseUuid(p.financial_record_id),
    tagId: parseUuid(p.tag_id),
  };
}

/** POST: adds one tag (idempotent). 404 if the record or the tag does not exist in the dashboard. */
export const POST = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id, tagId } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "editor");

  if ((await addFinancialRecordTag(dashboardId, id, tagId)) !== "ok") throw new ApiError("NOT_FOUND");
  return noContent();
});

/** DELETE: removes one tag (no error if it was not linked). */
export const DELETE = withErrors(async (request: NextRequest, ctx: Ctx) => {
  const { dashboardId, id, tagId } = await ids(ctx);
  await requireDashboardRole(request, dashboardId, "editor");

  if (!(await removeFinancialRecordTag(dashboardId, id, tagId))) throw new ApiError("NOT_FOUND");
  return noContent();
});
