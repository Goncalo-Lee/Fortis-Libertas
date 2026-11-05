import type { NextRequest } from "next/server";
import { getBankAccount, softDeleteBankAccount, updateBankAccount } from "@/db/queries/bank-accounts";
import { requireBankAccountRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { noContent, ok } from "@/lib/api/responses";
import { updateBankAccountSchema } from "@/lib/api/schemas/bank-account";
import { presentBankAccount } from "@/lib/api/response/bank-account";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ bank_account_id: string }> };

export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const id = parseUuid((await params).bank_account_id);
  const { session } = await requireBankAccountRole(request, id, "viewer");

  const row = await getBankAccount(id, session.user.id);
  if (!row) throw new ApiError("NOT_FOUND");
  return ok(await presentBankAccount(row));
});

export const PATCH = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const id = parseUuid((await params).bank_account_id);
  const { session } = await requireBankAccountRole(request, id, "editor");
  const input = await parseJson(request, updateBankAccountSchema);

  const row = await updateBankAccount(id, session.user.id, {
    name: input.name,
    initialBalance: input.initial_balance,
  });
  if (!row) throw new ApiError("NOT_FOUND");
  return ok(await presentBankAccount(row));
});

export const DELETE = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const id = parseUuid((await params).bank_account_id);
  await requireBankAccountRole(request, id, "owner");

  await softDeleteBankAccount(id);
  return noContent();
});
