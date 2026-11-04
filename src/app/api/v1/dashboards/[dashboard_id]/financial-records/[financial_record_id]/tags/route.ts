import type { NextRequest } from "next/server";
import { getFinancialRecord, setFinancialRecordTags } from "@/db/queries/financial-records";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { presentFinancialRecords } from "@/lib/api/financial-record-response";
import { ok } from "@/lib/api/responses";
import { setRecordTagsSchema } from "@/lib/api/schemas/financial-record";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string; financial_record_id: string }> };

/** PUT /financial-records/{id}/tags: replaces the full set of tags; returns the record. */
export const PUT = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const p = await params;
  const dashboardId = parseUuid(p.dashboard_id);
  const id = parseUuid(p.financial_record_id);
  const { session } = await requireDashboardRole(request, dashboardId, "editor");
  const { tag_ids } = await parseJson(request, setRecordTagsSchema);

  if (!(await setFinancialRecordTags(dashboardId, id, tag_ids))) throw new ApiError("NOT_FOUND");

  const row = await getFinancialRecord(dashboardId, id);
  if (!row) throw new ApiError("NOT_FOUND");
  const [data] = await presentFinancialRecords([row], session.user.id);
  return ok(data);
});
