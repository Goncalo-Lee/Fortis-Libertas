import { z } from "zod";

const name = z.string().trim().min(1).max(50);
const description = z.string().trim().max(5000).nullable();
const uuid = z.guid().transform((v) => v.toLowerCase());
const status = z.enum(["active", "settled", "cancelled", "pending", "paid", "late"]);
const currency = z.string().regex(/^[A-Z]{3}$/, "Must be a 3-letter ISO 4217 code.");
const price = z
  .string()
  .regex(/^\d{1,8}(\.\d{1,2})?$/, "Must be a decimal with up to 2 places.")
  .refine((v) => Number(v) > 0, { message: "Must be greater than 0." });
// ISO 8601 date-time ("2026-10-12T18:20:00.000Z" or with an offset), turned into a Date.
const dateTime = z.iso.datetime({ offset: true }).transform((v) => new Date(v));

const tagIds = z
  .array(z.guid())
  .max(50)
  .transform((ids) => ids.map((id) => id.toLowerCase()))
  .refine((ids) => new Set(ids).size === ids.length, { message: "Tag ids must be distinct." });

export const createFinancialRecordSchema = z
  .strictObject({
  record_type_id: uuid.optional(),
  category_id: uuid.optional(),
  payment_method_id: uuid,
  installment_plan_id: uuid.nullable().optional(),
  name,
  description: description.optional(),
  price,
  currency: currency.optional(),
  payment_date: dateTime,
  status,
  tag_ids: tagIds.optional(),
  })
  // Without a plan the record type and category are required; with one they are inherited from it.
  .superRefine((v, ctx) => {
    if (v.installment_plan_id) return;
    for (const key of ["record_type_id", "category_id"] as const) {
      if (!v[key]) ctx.addIssue({ code: "custom", path: [key], message: "Required when there is no installment plan." });
    }
  });

export const updateFinancialRecordSchema = z
  .strictObject({
    record_type_id: uuid,
    category_id: uuid,
    payment_method_id: uuid,
    installment_plan_id: uuid.nullable(),
    name,
    description,
    price,
    currency,
    payment_date: dateTime,
    status,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required." });

export const setRecordTagsSchema = z.strictObject({ tag_ids: tagIds });

const include = z.enum(["record_type", "category", "payment_method", "installment_plan"]);

/** How `converted` is calculated: with the rate of the payment date (default) or the latest one. */
export const rateMode = z.enum(["payment_date", "current"]).default("payment_date");

/** Single-value filters of GET /financial-records. The multi-value ones (see `listMultiQuery`) are read apart. */
export const listFinancialRecordsQuery = z.looseObject({
  installment_plan_id: z.union([z.literal("none"), uuid]).optional(),
  register_by_id: uuid.optional(),
  tag_match: z.enum(["any", "all"]).default("any"),
  currency: currency.optional(),
  payment_date_from: dateTime.optional(),
  payment_date_to: dateTime.optional(),
  min_price: z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, "Must be a decimal.").optional(),
  max_price: z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, "Must be a decimal.").optional(),
  q: z.string().trim().min(1).max(100).optional(),
  rate: rateMode,
  sort: z
    .enum(["payment_date", "-payment_date", "price", "-price", "name", "-name", "created_at", "-created_at"])
    .default("-payment_date"),
});

/** Multi-value query parameters: repeated or comma separated. */
export const listMultiQuery = z.object({
  record_type_id: z.array(uuid),
  category_id: z.array(uuid),
  payment_method_id: z.array(uuid),
  tag_id: z.array(uuid),
  status: z.array(status),
  include: z.array(include),
});

/** Query of the detail endpoint. */
export const getFinancialRecordQuery = z.looseObject({ rate: rateMode });
