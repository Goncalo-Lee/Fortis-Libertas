import { z } from "zod";
import { todayUtc } from "@/lib/exchange";

const currency = z.string().regex(/^[A-Z]{3}$/, "Must be a 3-letter ISO 4217 code.");

/**
 * Query parameters of GET /exchange-rates (endpoints.md, section 17.2).
 *
 * - `base` and `quote` are required and must differ (the rate of a currency to itself is always 1).
 * - `date` is optional ("YYYY-MM-DD"). It cannot be in the future: there is no rate for a day that has not happened.
 *   `todayUtc()` is called at validation time, not at load time, so it stays right after midnight.
 * - Whether the codes exist in the `Currency` catalog is checked afterwards, in the database (`requireCurrencyId`).
 */
export const exchangeRateQuery = z
  .looseObject({
    base: currency,
    quote: currency,
    date: z.iso.date().refine((d) => d <= todayUtc(), "Cannot be in the future.").optional(),
  })
  .refine((v) => v.base !== v.quote, { path: ["quote"], message: "Must be different from base." });
