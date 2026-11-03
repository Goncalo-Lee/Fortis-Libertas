import { z } from "zod";
import { rateMode } from "./financial-record";

/** Longest period a report may cover (endpoints.md, section 16.2). */
const MAX_RANGE_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

const currency = z.string().regex(/^[A-Z]{3}$/, "Must be a 3-letter ISO 4217 code.");
// ISO 8601 date-time ("2026-10-01T00:00:00.000Z" or with an offset), turned into a Date.
const dateTime = z.iso.datetime({ offset: true }).transform((v) => new Date(v));

/** Every status a financial record can have. */
export const RECORD_STATUSES = ["active", "settled", "cancelled", "pending", "paid", "late"] as const;

/** Statuses used when the caller does not send `status`: all of them except `cancelled`. */
const DEFAULT_STATUSES = RECORD_STATUSES.filter((s) => s !== "cancelled");

/**
 * Single-value query parameters of GET /dashboards/{dashboard_id}/reports/summary.
 * `status` is multi-value, so it is read apart with `getMulti` (see `reportStatusQuery`).
 */
export const summaryReportQuery = z
  .looseObject({
    payment_date_from: dateTime,
    payment_date_to: dateTime,
    group_by: z.enum(["record_type", "category", "tag", "payment_method", "month"]).default("record_type"),
    currency: currency.optional(),
    rate: rateMode,
  })
  // The period must be in order and cover at most MAX_RANGE_DAYS, so a single request cannot scan the whole table.
  .superRefine((v, ctx) => {
    const span = v.payment_date_to.getTime() - v.payment_date_from.getTime();
    if (span < 0) {
      ctx.addIssue({ code: "custom", path: ["payment_date_to"], message: "Must be on or after payment_date_from." });
    } else if (span > MAX_RANGE_DAYS * DAY_MS) {
      ctx.addIssue({ code: "custom", path: ["payment_date_to"], message: `The period cannot exceed ${MAX_RANGE_DAYS} days.` });
    }
  });

/** `?status=` (repeated or comma separated). An empty list means "the default statuses". */
export const reportStatusQuery = z.object({
  status: z.array(z.enum(RECORD_STATUSES)).transform((list) => (list.length > 0 ? list : DEFAULT_STATUSES)),
});
