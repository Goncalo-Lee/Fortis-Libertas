import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { exchangeRate } from "@/db/schema";

/* ======
  READ
======= */

/** The cached rate of a day for a currency pair (with when it was cached), or `null`. */
export async function getCachedRate(rateDate: string, baseCurrencyId: string, quoteCurrencyId: string) {
  const [row] = await db
    .select({ rate: exchangeRate.rate, createdAt: exchangeRate.createdAt })
    .from(exchangeRate)
    .where(
      and(
        eq(exchangeRate.rateDate, rateDate),
        eq(exchangeRate.baseCurrencyId, baseCurrencyId),
        eq(exchangeRate.quoteCurrencyId, quoteCurrencyId),
      ),
    )
    .limit(1);
  return row ?? null;
}
