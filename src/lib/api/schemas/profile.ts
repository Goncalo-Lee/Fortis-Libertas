import { z } from "zod";

// Helper: produces today's date as "YYYY-MM-DD" in UTC.
// Defined as a function (not a constant) so the value is evaluated
// at validation time, not at module load time. Critical for long-running
// servers where a cached constant would go stale after midnight UTC.
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Validation schema for PATCH /profile (partial updates).
 *
 * Design decisions:
 * - .strictObject(): rejects unknown keys, preventing mass-assignment attacks
 *   where a client tries to set fields like `userId` or `role`.
 * - .partial(): makes every field optional, enabling true partial updates.
 * - .refine(): enforces at least one field, rejecting empty {} payloads that
 *   would otherwise produce a pointless no-op UPDATE query.
 *
 * All date/time values arrive as strings (JSON has no Date type) and are
 * validated in ISO format before reaching the database layer.
 */
export const updateProfileSchema = z
  .strictObject({
    // Birth date: ISO date string OR null (to clear the field).
    // .refine() compares lexicographically — valid because ISO 8601
    // "YYYY-MM-DD" strings sort correctly as plain strings.
    birth_date: z.iso
      .date()
      .refine((d) => d <= today(), "Birth date cannot be in the future.")
      .nullable(),

    // Phone: trimmed, non-empty, capped at 20 chars, OR null to clear.
    // Note: no format regex here — phone formats vary wildly by region.
    // Stricter validation (E.164) could be added but may reject valid inputs.
    phone: z.string().trim().min(1).max(20).nullable(),

    // Currency: exactly 3 uppercase letters (ISO 4217).
    // Not nullable — presumably a required field that can be changed but not cleared.
    currency: z.string().regex(/^[A-Z]{3}$/, "Must be an ISO 4217 code, e.g EUR."),

    // Language: BCP 47 tag (e.g. "en", "pt-BR", "zh-Hant-TW").
    // Regex allows: primary subtag (2-3 letters) + optional hyphenated subtags.
    // max(254) guards against absurdly long input before regex evaluation.
    language: z
      .string()
      .max(254)
      .regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, "Must be a BCP 47 tag, e.g. pt-PT."),
  })
  // Make all fields optional for partial updates
  .partial()
  // Reject empty payloads — an update with no fields is meaningless
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required.",
  });
