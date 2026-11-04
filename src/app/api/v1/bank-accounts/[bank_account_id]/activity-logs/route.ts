import type { NextRequest } from "next/server";
import { listActivityLogs } from "@/db/queries/activity-logs";
import { requireBankAccountRole } from "@/lib/api/access";
import { readActivityLogQuery } from "@/lib/api/activity-log-query";
import { withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { paginated } from "@/lib/api/responses";
import { serializeActivityLog } from "@/lib/api/serializers/activity-log";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ bank_account_id: string }> };

/**
 * GET /api/v1/bank-accounts/{bank_account_id}/activity-logs
 *
 * Who did what in the bank account: the account itself (including freeze/unfreeze), its members and its cards.
 * Card entries never contain card data, only the type and the names of changed fields (endpoints.md, section 19).
 *
 * Errors: 400 bad id, 401, 403 for members below owner, 404 for non-members, 422 bad query.
 */
export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const bankAccountId = parseUuid((await params).bank_account_id);
  await requireBankAccountRole(request, bankAccountId, "owner");

  const { page, perPage, filters } = readActivityLogQuery(request.nextUrl.searchParams);
  const { rows, total } = await listActivityLogs({ scope: "bank_account", bankAccountId }, filters);

  return paginated(rows.map((row) => serializeActivityLog(row)), { page, perPage, total });
});
