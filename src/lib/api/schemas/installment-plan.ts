import { z } from "zod";

const name = z.string().trim().min(1).max(50);
const description = z.string().trim().max(5000).nullable();
const uuid = z.guid().transform((v) => v.toLowerCase());
const status = z.enum(["cancelled", "pending", "paid", "late"]);
const currency = z.string().regex(/^[A-Z]{3}$/, "Must be a 3-letter ISO 4217 code.");
const totalAmount = z
  .string()
  .regex(/^\d{1,8}(\.\d{1,2})?$/, "Must be a decimal with up to 2 places.")
  .refine((v) => Number(v) > 0, { message: "Must be greater than 0." });
const totalInstallments = z.number().int().min(1).max(1000);
const dueDate = z.iso.date();

const tagIds = z
  .array(z.guid())
  .max(50)
  .transform((ids) => ids.map((id) => id.toLowerCase()))
  .refine((ids) => new Set(ids).size === ids.length, { message: "Tag ids must be distinct." });

export const createInstallmentPlanSchema = z.strictObject({
  name,
  description: description.optional(),
  category_id: uuid,
  currency: currency.optional(),
  tag_ids: tagIds.optional(),
  total_amount: totalAmount,
  total_installments: totalInstallments,
  due_date: dueDate,
  status: status.optional(),
});

export const updateInstallmentPlanSchema = z
  .strictObject({
    name,
    description,
    category_id: uuid,
    currency,
    total_amount: totalAmount,
    total_installments: totalInstallments,
    due_date: dueDate,
    status,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required." });

export const setPlanTagsSchema = z.strictObject({ tag_ids: tagIds });

/** Query of GET /installment-plans. `status` can be repeated or comma separated (read apart, see the route). */
export const listInstallmentPlansQuery = z.looseObject({
  q: z.string().trim().min(1).max(100).optional(),
  due_from: dueDate.optional(),
  due_to: dueDate.optional(),
  sort: z
    .enum(["due_date", "-due_date", "total_amount", "-total_amount", "created_at", "-created_at"])
    .default("due_date"),
});

export const statusListSchema = z.array(status);

export const deleteInstallmentPlanQuery = z.looseObject({
  detach_records: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});
