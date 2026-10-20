import { z } from "zod";

const name = z.string().trim().min(1).max(50);
const description = z.string().trim().max(5000).nullable();

export const createTagSchema = z.strictObject({
  name,
  description: description.optional(),
});

export const updateTagSchema = z
  .strictObject({ name, description })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required." });

export const listTagsQuery = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(["name", "-name", "created_at", "-created_at"]).default("name"),
});
