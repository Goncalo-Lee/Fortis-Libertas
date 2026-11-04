/**
 * Client of the Frankfurter API (ECB reference rates), https://frankfurter.dev.
 * It only talks to the provider; caching lives in `./index.ts`.
 */

const BASE_URL = process.env.EXCHANGE_RATE_API_URL ?? "https://api.frankfurter.dev/v1";
// How long to wait for the provider. Historical dates can be slower than `latest`, so the default is generous;
// set EXCHANGE_RATE_TIMEOUT_MS in .env to change it.
const TIMEOUT_MS = Number(process.env.EXCHANGE_RATE_TIMEOUT_MS) || 10_000;

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

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  } catch (error) {
    // Say where the request went: a timeout alone does not tell which provider URL was used.
    throw new Error(`Request to ${url} failed`, { cause: error });
  }
  if (!response.ok) throw new Error(`Exchange rate provider answered ${response.status}`);

  const body = (await response.json()) as { rates?: Record<string, unknown> };
  const value = body.rates?.[quote];

  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Exchange rate provider sent no rate for ${base}/${quote}`);
  }
  return value.toFixed(8);
}
