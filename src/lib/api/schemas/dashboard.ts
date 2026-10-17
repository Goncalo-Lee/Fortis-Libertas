import { z } from "zod";

// Reusable name validator: trimmed, non-empty, max 50 chars.
// Extracted as a constant to ensure consistent validation across
// create and update schemas without duplication.
const name = z.string().trim().min(1).max(50);

/**
 * Schema for POST /dashboards (creation).
 *
 * - .strictObject(): Rejects unknown keys (e.g., "owner_id", "role") to prevent
 *   mass-assignment attacks where a client tries to set privileged fields.
 * - `name`: Required.
 * - `is_active`: Optional boolean. Defaults to true in the DB handler if omitted.
 */
export const createDashboardSchema = z.strictObject({
  name,
  is_active: z.boolean().optional(),
});

/**
 * Schema for PATCH /dashboards/:id (partial update).
 *
 * - .strictObject(): Same security benefit as above.
 * - .partial(): Makes both fields optional, enabling true partial updates.
 * - .refine(...): Ensures the payload isn't empty {}.
 *   Without this, an empty body would pass validation but result in a no-op DB write.
 *
 * Note: Unlike `createDashboardSchema`, `is_active` is defined as `z.boolean()`
 * (not `.optional()`) inside the object before `.partial()`. This is correct:
 * if the key is present, it MUST be a boolean; if absent, it's ignored.
 */
export const updateDashboardSchema = z
  .strictObject({ name, is_active: z.boolean() })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required.",
  });

/**
 * Schema for GET /dashboards?query_params (listing filters).
 *
 * Handles URL query string parsing and type coercion:
 * - `is_active`: String "true"/"false" -> Boolean.
 *   Uses .transform() to convert the raw string to a native bool.
 *   Undefined if neither "true" nor "false" is sent.
 * - `role`: Restricts to valid Role literals.
 * - `q`: Search query, trimmed, 1-100 chars.
 * - `sort`: Whitelist of allowed sort directions. Defaults to "name".
 *   The "-name" syntax is parsed here and handled by the DB query logic.
 */
export const listDashboardQuery = z.object({
  // Transform string "true"/"false" to boolean true/false
  is_active: z.enum(["true", "false"]).transform((v) => v === "true").optional(),

  // Restrict role to known values
  role: z.enum(["owner", "editor", "viewer"]).optional(),

  // Search term
  q: z.string().trim().min(1).max(100).optional(),

  // Sort order with default
  sort: z.enum(["name", "-name", "created_at", "-created_at"]).default("name"),

  // Show soft delete
  // Transforms the string "true"/"false" from the URL into a boolean.
  // If omitted, defaults to undefined (which triggers the default behavior: show only active).
  deleted: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
});
