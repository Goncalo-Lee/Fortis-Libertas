import type { NextRequest } from "next/server";
import { requireCurrencyId } from "@/db/queries/catalogs";
import { requireSession } from "@/lib/api/auth";
import { withErrors } from "@/lib/api/errors";
import { ok } from "@/lib/api/responses";
import { exchangeRateQuery } from "@/lib/api/schemas/exchange-rate";
import { requireRate } from "@/lib/exchange";

export const runtime = "nodejs";

/**
 * GET /api/v1/exchange-rates?base=USD&quote=EUR&date=2026-10-30
 *
 * Returns how many units of `quote` one unit of `base` is worth on a day (endpoints.md, section 17.2).
 * Lets a client show "1 USD = 0.92 EUR" next to a converted amount, or preview a conversion before saving.
 *
 * Pipeline:
 * 1. requireSession     -> 401 / 403
 * 2. Zod                -> 422 for a missing/invalid code, base equal to quote, or a future date
 * 3. requireCurrencyId  -> 422 if a code is not in the Currency catalog (e.g. JPY)
 * 4. requireRate        -> cached rate, or one fetched from Frankfurter and cached; 502 if neither exists
 *
 * Without `date`, the latest rate is used (`"current"`), the same one used for today's records.
 */
export const GET = withErrors(async (request: NextRequest) => {
  await requireSession(request);

  const query = exchangeRateQuery.parse(Object.fromEntries(request.nextUrl.searchParams));
  await Promise.all([requireCurrencyId(query.base, "/base"), requireCurrencyId(query.quote, "/quote")]);

  const rate = await requireRate(query.base, query.quote, query.date ?? "current");

  return ok({
    base: query.base,
    quote: query.quote,
    rate: rate.rate,
    rate_date: rate.rateDate,
  });
});
