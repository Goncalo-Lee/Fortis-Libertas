import { z } from "zod";

// --- Field Definitions ---
// Validates the 'name' field: must be a non-empty string, trimmed, max 50 chars.
const name = z.string().trim().min(1).max(50);

// Validates the 'description' field: optional, trimmed, max 5000 chars, allows null.
// Note: .nullable() allows explicit null, .optional() allows undefined.
// The combination below ensures it accepts undefined (if omitted) or null/empty string if provided.
const description = z.string().trim().max(5000).nullable();

/**
 * Schema for creating a new RecordType.
 * - Uses strictObject to reject any extra keys not defined in the schema.
 * - 'name' is required.
 * - 'description' is optional (can be omitted entirely).
 */
export const createRecordTypeSchema = z.strictObject({
  name,
  description: description.optional(),
});

/**
 * Schema for updating an existing RecordType.
 * - Starts with all fields (name, description) defined.
 * - .partial() makes all fields optional individually.
 * - .refine(...) adds a business rule: at least one field must be present in the payload.
 *   This prevents no-op updates like PATCH {} which might be valid technically but useless logically.
 */
export const updateRecordTypeSchema = z
  .strictObject({ name, description })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required." });

/**
 * Schema for querying/listing RecordTypes.
 * - 'q': Optional search query string, trimmed, min 1 char, max 100 chars.
 * - 'sort': Defines allowed sorting options.
 *   - Enum values: "name", "-name" (desc), "created_at", "-created_at" (desc).
 *   - Defaults to "name" ascending if not provided.
 *   - Note: The enum enforces safe column names, preventing SQL injection if passed directly to ORDER BY.
 */
export const listRecordTypesQuery = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(["name", "-name", "created_at", "-created_at"]).default("name"),
});
