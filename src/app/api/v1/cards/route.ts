import type { NextRequest } from "next/server";
import { listCards } from "@/db/queries/cards";
import { requireSession } from "@/lib/api/auth";
import { withErrors } from "@/lib/api/errors";
import { parsePagination } from "@/lib/api/pagination";
import { paginated } from "@/lib/api/responses";
import { listCardsQuery } from "@/lib/api/schemas/card";
import { serializeCard } from "@/lib/api/serializers/card";

export const runtime = "nodejs";

/** GET /cards: cards owned by the caller, across bank accounts. */
export const GET = withErrors(async (request: NextRequest) => {
  const session = await requireSession(request);

  const { searchParams } = request.nextUrl;
  const { page, perPage, offset } = parsePagination(searchParams);
  const { bank_id, type_card, frozen, sort } = listCardsQuery.parse(Object.fromEntries(searchParams));

  const { rows, total } = await listCards(session.user.id, {
    mine: true,
    bankId: bank_id,
    typeCard: type_card,
    frozen,
    sort,
    limit: perPage,
    offset,
  });

  return paginated(rows.map(serializeCard), { page, perPage, total });
});
