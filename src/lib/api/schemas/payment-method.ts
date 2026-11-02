import { z } from "zod";

const name = z.string().trim().min(1).max(50);
const description = z.string().trim().max(5000);
const cardId = z
  .guid()
  .transform((v) => v.toLowerCase())
  .nullable();

export const createPaymentMethodSchema = z.strictObject({
  name,
  description: description.optional(),
  card_id: cardId.optional(),
});

export const updatePaymentMethodSchema = z
  .strictObject({ name, description, card_id: cardId })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required." });

export const listPaymentMethodsQuery = z.looseObject({
  q: z.string().trim().min(1).max(100).optional(),
  mine: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  card_id: z
    .guid()
    .transform((v) => v.toLowerCase())
    .optional(),
  sort: z.enum(["name", "-name", "created_at", "-created_at"]).default("name"),
});
