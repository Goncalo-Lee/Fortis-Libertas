import { z } from "zod";
import { SOURCE_TYPES } from "@/db/queries/transactions/type";
import { rateMode } from "./financial-record";

const uuid = z.guid().transform((v) => v.toLowerCase());
const dateTime = z.iso.datetime({ offset: true }).transform((v) => new Date(v));

/**
 * Single-value query parameters of GET /dashboards/{dashboard_id}/transactions (endpoints.md, section 20.3).
 * `source_type` is multi-value and is parsed apart (`transactionMultiQuery`).
 */
export const listTransactionsQuery = z
  .looseObject({
    record_type_id: uuid.optional(),
    user_id: uuid.optional(),
    occurred_from: dateTime.optional(),
    occurred_to: dateTime.optional(),
    // Query strings are text: "true"/"false" become a boolean, anything else is a 422.
    deleted: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
    rate: rateMode,
    sort: z.enum(["occurred_at", "-occurred_at"]).default("-occurred_at"),
  })
  .refine((v) => !v.occurred_from || !v.occurred_to || v.occurred_from <= v.occurred_to, {
    path: ["occurred_to"],
    message: "Must be on or after occurred_from.",
  });

/** `?source_type=` (repeated or comma separated). Unknown types are a 422, so typos do not silently return nothing. */
export const transactionMultiQuery = z.object({
  source_type: z.array(z.enum(SOURCE_TYPES)),
});
