import type { NextRequest } from "next/server";
import { softDeleteCard, updateCard } from "@/db/queries/cards";
import { requireCardAccess } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { noContent, ok } from "@/lib/api/responses";
import { updateCardSchema } from "@/lib/api/schemas/card";
import { serializeCard } from "@/lib/api/serializers/card";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ card_id: string }> };

/** GET /cards/{id}: any member of the card's bank account. */
export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const id = parseUuid((await params).card_id);
  const { card } = await requireCardAccess(request, id);
  return ok(serializeCard(card));
});

/** PATCH /cards/{id}: card owner or bank account owner. */
export const PATCH = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const id = parseUuid((await params).card_id);
  const { session } = await requireCardAccess(request, id, { manage: true });
  const input = await parseJson(request, updateCardSchema);

  const row = await updateCard(id, session.user.id, {
    cardholderName: input.cardholder_name,
    typeCard: input.type_card,
    cardNumber: input.card_number,
    expiryDate: input.expiry_date,
    cvv: input.cvv,
  });
  if (!row) throw new ApiError("NOT_FOUND");
  return ok(serializeCard(row));
});

/** DELETE /cards/{id}: card owner or bank account owner. Payment methods lose their `card_id`. */
export const DELETE = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const id = parseUuid((await params).card_id);
  await requireCardAccess(request, id, { manage: true });

  await softDeleteCard(id);
  return noContent();
});
