import { z } from "zod";

/** Query parameters of GET /dashboards/{dashboard_id}/home (endpoints.md, section 18.2). */
export const homeQuery = z.looseObject({
  // "2026-11". Month 00 or 13 is rejected by the regex.
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Must be a month as YYYY-MM.").optional(),
  currency: z.string().regex(/^[A-Z]{3}$/, "Must be a 3-letter ISO 4217 code.").optional(),
});

/**
 * First and last instant (UTC) of a "YYYY-MM" month, or of the current month when none is given.
 * `Date.UTC(y, m, 0)` is the last day of month `m` (1-based), because day 0 means "the day before the 1st".
 */
export function monthRange(month?: string) {
  const now = new Date();
  const [year, m] = month ? month.split("-").map(Number) : [now.getUTCFullYear(), now.getUTCMonth() + 1];
  const from = new Date(Date.UTC(year, m - 1, 1));
  const to = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));
  return { from, to };
}
