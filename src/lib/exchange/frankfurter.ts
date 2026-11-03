/**
 * Client of the Frankfurter API (ECB reference rates), https://frankfurter.dev.
 * It only talks to the provider; caching lives in `./index.ts`.
 */

const BASE_URL = process.env.EXCHANGE_RATE_API_URL ?? "https://api.frankfurter.dev/v1";
const TIMEOUT_MS = 4000;

/**
 * Fetches the rate to convert one unit of `base` into `quote`.
 *
 * Frankfurter publishes on working days; for other dates it answers with the previous working day,
 * which is exactly what the cache stores under the requested date.
 *
 * @param date - `YYYY-MM-DD`, or `latest` for the most recent rate
 * @returns The rate as a decimal string with 8 places
 * @throws {Error} When the provider is unreachable, answers with an error or sends an unusable rate
 */
export async function fetchRate(base: string, quote: string, date: string): Promise<string> {
  const url = `${BASE_URL}/${date}?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(quote)}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  if (!response.ok) throw new Error(`Exchange rate provider answered ${response.status}`);

  const body = (await response.json()) as { rates?: Record<string, unknown> };
  const value = body.rates?.[quote];

  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Exchange rate provider sent no rate for ${base}/${quote}`);
  }
  return value.toFixed(8);
}
