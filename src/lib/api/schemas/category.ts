import { z } from "zod";


const name = z.string().trim().min(1).max(50);
const description = z.string().trim().max(5000).nullable();


export const tagIds = z
  .array(z.guid())
  .max(50)
  .transform((ids) => ids.map((id) => id.toLowerCase()))
  .refine((ids) => new Set(ids).size === ids.length, { message: "Tag ids must be distinct." });

export const createCategorySchema = z.strictObject({
  name,
  description: description.optional(),
  tag_ids: tagIds.optional(),
});

export const updateCategorySchema = z
  .strictObject({ name, description })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required." });

export const setCategoryTagsSchema = z.strictObject({ tag_ids: tagIds });

export const listCategoriesQuery = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  tag_id: z.guid().optional(),
  include: z.enum(["tags"]).optional(),
  sort: z.enum(["name", "-name", "created_at", "-created_at"]).default("name"),
});

export const getCategoryQuery = z.object({ include: z.enum(["tags"]).optional() });
