import { db } from "@/db";
import { exchangeRate } from "@/db/schema";

/* ======
  WRITE
======= */

/**
 * Caches a rate. If one already exists for that day and pair (today's rate being refreshed, or two requests
 * racing), it is overwritten and `created_at` is renewed.
 */
export async function saveRate(input: {
  rateDate: string;
  baseCurrencyId: string;
  quoteCurrencyId: string;
  rate: string;
  source?: string;
}) {
  const source = input.source ?? "frankfurter";
  await db
    .insert(exchangeRate)
    .values({
      rateDate: input.rateDate,
      baseCurrencyId: input.baseCurrencyId,
      quoteCurrencyId: input.quoteCurrencyId,
      rate: input.rate,
      source,
    })
    .onDuplicateKeyUpdate({ set: { rate: input.rate, source, createdAt: new Date() } });
}
