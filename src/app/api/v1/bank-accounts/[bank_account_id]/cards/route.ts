import type { NextRequest } from "next/server";
import { createCard, listCards } from "@/db/queries/cards";
import { requireBankAccountRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { parsePagination } from "@/lib/api/pagination";
import { created, paginated } from "@/lib/api/responses";
import { createCardSchema, listBankAccountCardsQuery } from "@/lib/api/schemas/card";
import { serializeCard } from "@/lib/api/serializers/card";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ bank_account_id: string }> };

/** GET /bank-accounts/{id}/cards: any member sees the cards of the account. */
export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const id = parseUuid((await params).bank_account_id);
  const { session } = await requireBankAccountRole(request, id, "viewer");

  const { searchParams } = request.nextUrl;
  const { page, perPage, offset } = parsePagination(searchParams);
  const { type_card, frozen, sort } = listBankAccountCardsQuery.parse(Object.fromEntries(searchParams));

  const { rows, total } = await listCards(session.user.id, {
    bankAccountId: id,
    typeCard: type_card,
    frozen,
    sort,
    limit: perPage,
    offset,
  });

  return paginated(rows.map(serializeCard), { page, perPage, total });
});

/** POST /bank-accounts/{id}/cards: editor+; the owner (`user_id`) defaults to the caller. */
export const POST = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const id = parseUuid((await params).bank_account_id);
  const { session } = await requireBankAccountRole(request, id, "editor");
  const input = await parseJson(request, createCardSchema);

  const row = await createCard(id, session.user.id, {
    cardholderName: input.cardholder_name,
    typeCard: input.type_card,
    cardNumber: input.card_number,
    expiryDate: input.expiry_date,
    cvv: input.cvv,
    userId: input.user_id,
    colorId: input.color_id,
  });
  if (!row) throw new ApiError("INTERNAL_ERROR");

  return created(serializeCard(row), `/api/v1/cards/${row.id}`);
});
