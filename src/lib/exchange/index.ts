import { findCurrencyId } from "@/db/queries/catalogs";
import { getCachedRate, saveRate } from "@/db/queries/exchange-rates";
import { ApiError } from "@/lib/api/errors";
import { multiplyDecimal, normalizeRate } from "./decimal";
import { fetchRate } from "./frankfurter";

/**
 * Currency conversion (endpoints.md, section 1.8).
 *
 * Rates come from the provider and are cached in `Exchange_Rate`:
 * - past dates are definitive, so a cached rate is used forever;
 * - today's rate is refreshed when it is older than `TODAY_TTL_MS`;
 * - if the provider fails, a stale cached rate is used; with none, the conversion is unavailable.
 */

const TODAY_TTL_MS = 60 * 60 * 1000;

/** `rate` = units of the quote currency per one unit of the base currency. */
export type ExchangeRate = { rate: string; rateDate: string };

/** The `converted` object returned by the API. */
export type Converted = { amount: string; currency: string; rate: string; rate_date: string };

/** `YYYY-MM-DD` of a date (UTC), or `current` for the latest rate. */
export type RateDate = string | "current";

export const todayUtc = () => new Date().toISOString().slice(0, 10);

/** The `YYYY-MM-DD` part of a Date or ISO string. */
export const toDay = (value: Date | string) =>
  typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);

// Concurrent requests for the same rate share one lookup (and one provider call).
const inflight = new Map<string, Promise<ExchangeRate | null>>();

/**
 * The rate to convert one unit of `base` into `quote` on `date`, or `null` when none is available.
 * Never throws because of the provider: the API does not fail because of a conversion.
 */
export function getRate(base: string, quote: string, date: RateDate): Promise<ExchangeRate | null> {
  const today = todayUtc();
  const day = date === "current" || date > today ? today : date;
  const key = `${day}|${base}|${quote}`;

  let pending = inflight.get(key);
  if (!pending) {
    pending = loadRate(base, quote, day, today).finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  return pending;
}

async function loadRate(base: string, quote: string, day: string, today: string): Promise<ExchangeRate | null> {
  if (base === quote) return { rate: "1", rateDate: day };

  const [baseId, quoteId] = await Promise.all([findCurrencyId(base), findCurrencyId(quote)]);
  if (!baseId || !quoteId) return null;

  const cached = await getCachedRate(day, baseId, quoteId);
  const fresh = cached && (day < today || Date.now() - new Date(cached.createdAt).getTime() < TODAY_TTL_MS);
  if (cached && fresh) return { rate: normalizeRate(cached.rate), rateDate: day };

  try {
    const rate = await fetchRate(base, quote, day === today ? "latest" : day);
    await saveRate({ rateDate: day, baseCurrencyId: baseId, quoteCurrencyId: quoteId, rate });
    return { rate: normalizeRate(rate), rateDate: day };
  } catch (error) {
    console.error(`Exchange rate ${base}/${quote} for ${day} unavailable:`, error);
    return cached ? { rate: normalizeRate(cached.rate), rateDate: day } : null;
  }
}

/** Same as `getRate`, but throws `502 EXCHANGE_RATE_UNAVAILABLE` for endpoints that cannot answer without it. */
export async function requireRate(base: string, quote: string, date: RateDate): Promise<ExchangeRate> {
  const rate = await getRate(base, quote, date);
  if (!rate) throw new ApiError("EXCHANGE_RATE_UNAVAILABLE");
  return rate;
}

/**
 * Converts an amount between two currencies, rounded to 2 places.
 *
 * @returns The converted amount with the rate used, or `null` when no rate is available
 */
export async function convertAmount(amount: string, from: string, to: string, date: RateDate) {
  const rate = await getRate(from, to, date);
  if (!rate) return null;
  return { amount: multiplyDecimal(amount, rate.rate), rate: rate.rate, rateDate: rate.rateDate };
}

/**
 * Builds the converter of one request: converts amounts into `target` (the caller's profile currency) and
 * returns the `converted` object of the API.
 *
 * It returns `null` when the amount is already in `target` or when no rate is available. Rates are memoised per
 * (currency, date), so listing many records only looks up each distinct pair once.
 *
 * @example
 * const convert = createConverter(profile.currency);
 * const converted = await convert(record.price, record.currency, toDay(record.paymentDate));
 */
export function createConverter(target: string) {
  const memo = new Map<string, Promise<ExchangeRate | null>>();

  return async function convert(amount: string, from: string, date: RateDate): Promise<Converted | null> {
    if (from === target) return null;

    const key = `${from}|${date}`;
    let pending = memo.get(key);
    if (!pending) {
      pending = getRate(from, target, date);
      memo.set(key, pending);
    }

    const rate = await pending;
    if (!rate) return null;

    return { amount: multiplyDecimal(amount, rate.rate), currency: target, rate: rate.rate, rate_date: rate.rateDate };
  };
}
