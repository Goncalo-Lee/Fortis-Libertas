import type { NextRequest } from "next/server";
import { setBankAccountFrozenState } from "@/db/queries/bank-accounts";
import { requireBankAccountRole } from "@/lib/api/access";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { ok } from "@/lib/api/responses";
import { presentBankAccount } from "@/lib/api/bank-account-response";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ bank_account_id: string }> };

/** POST /bank-accounts/{id}/freeze: owner only, idempotent. Returns the updated account. */
export const POST = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const id = parseUuid((await params).bank_account_id);
  const { session } = await requireBankAccountRole(request, id, "owner");

  const row = await setBankAccountFrozenState(id, session.user.id, true);
  if (!row) throw new ApiError("NOT_FOUND");
  return ok(await presentBankAccount(row));
});
