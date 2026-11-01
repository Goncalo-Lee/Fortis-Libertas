import type { NextRequest } from "next/server";
import { createBankAccount, listBankAccounts } from "@/db/queries/bank-accounts";
import { requireSession } from "@/lib/api/auth";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parsePagination } from "@/lib/api/pagination";
import { created, paginated } from "@/lib/api/responses";
import { createBankAccountSchema, listBankAccountsQuery } from "@/lib/api/schemas/bank-account";
import { serializeBankAccount } from "@/lib/api/serializers/bank-account";

export const runtime = "nodejs";

/** GET /bank-accounts: accounts the caller belongs to. */
export const GET = withErrors(async (request: NextRequest) => {
  const session = await requireSession(request);

  const { searchParams } = request.nextUrl;
  const { page, perPage, offset } = parsePagination(searchParams);
  const filters = listBankAccountsQuery.parse(Object.fromEntries(searchParams));

  const { rows, total } = await listBankAccounts(session.user.id, {
    q: filters.q,
    role: filters.role,
    frozen: filters.frozen,
    sort: filters.sort,
    limit: perPage,
    offset,
  });

  return paginated(rows.map(serializeBankAccount), { page, perPage, total });
});

/** POST /bank-accounts: creates an account; the caller becomes its owner. */
export const POST = withErrors(async (request: NextRequest) => {
  const session = await requireSession(request);
  const input = await parseJson(request, createBankAccountSchema);

  const row = await createBankAccount(session.user.id, {
    name: input.name,
    initialBalance: input.initial_balance,
    currency: input.currency,
  });
  if (!row) throw new ApiError("INTERNAL_ERROR");

  return created(serializeBankAccount(row), `/api/v1/bank-accounts/${row.id}`);
});
