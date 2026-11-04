import { z } from "zod";

/**
 * Validation schema for PATCH /me (endpoints.md, section 3.4).
 *
 * - `.strictObject()` rejects unknown keys, so a client cannot set `email`, `suspended_at` or any other
 *   server-controlled field through this endpoint (`email` changes go through Better Auth).
 * - `.partial()` makes every field optional; `.refine()` rejects an empty `{}`.
 * - `null` clears `user_name` or `image`. `full_name` is required in the database, so it cannot be cleared.
 */
export const updateMeSchema = z
  .strictObject({
    user_name: z
      .string()
      .trim()
      .min(3)
      .max(254)
      .regex(/^[A-Za-z0-9._-]+$/, "Only letters, digits, '.', '_' and '-' are allowed.")
      .nullable(),
    full_name: z.string().trim().min(1).max(254),
    // A URL or a path to an uploaded file. No format check: both shapes are valid.
    image: z.string().trim().min(1).max(2048).nullable(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required." });

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
