import type { NextRequest } from "next/server";
import { listCurrencies } from "@/db/queries/catalogs";
import { requireSession } from "@/lib/api/auth";
import { withErrors } from "@/lib/api/errors";
import { parsePagination } from "@/lib/api/pagination";
import { paginated } from "@/lib/api/responses";
import { listCatalogQuery } from "@/lib/api/schemas/catalog";
import { serializeCurrency } from "@/lib/api/serializers/catalog";

export const runtime = "nodejs";

export const GET = withErrors(async (request: NextRequest) => {
  await requireSession(request);

  const { searchParams } = request.nextUrl;
  const { page, perPage, offset } = parsePagination(searchParams);
  const filters = listCatalogQuery.parse(Object.fromEntries(searchParams));

  const { rows, total } = await listCurrencies({ ...filters, limit: perPage, offset });

  return paginated(rows.map(serializeCurrency), { page, perPage, total });
});
