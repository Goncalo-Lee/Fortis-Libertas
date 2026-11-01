import type { NextRequest } from "next/server";
import { setCardFrozenState } from "@/db/queries/cards";
import { requireCardAccess } from "@/lib/api/access";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { ok } from "@/lib/api/responses";
import { serializeCard } from "@/lib/api/serializers/card";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ card_id: string }> };

/** POST /cards/{id}/freeze: card owner or bank account owner, idempotent. */
export const POST = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const id = parseUuid((await params).card_id);
  const { session } = await requireCardAccess(request, id, { manage: true });

  const row = await setCardFrozenState(id, session.user.id, true);
  if (!row) throw new ApiError("NOT_FOUND");
  return ok(serializeCard(row));
});
