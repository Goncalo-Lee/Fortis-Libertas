/**
 * Converts a Date object (or null/undefined) to an ISO 8601 UTC string.
 *
 * Standardizes datetime values for API responses, ensuring consistent formatting
 * regardless of the client's timezone. Returns `null` for falsy inputs to avoid
 * "Invalid Date" strings or exceptions.
 *
 * @param value - Date object, null, or undefined
 * @returns ISO 8601 string (e.g., "2026-10-14T10:30:00.000Z") or null
 *
 * Example:
 * toIso(new Date("2026-10-14")) -> "2026-10-14T00:00:00.000Z"
 * toIso(null) -> null
 */
export function toIso(value: Date | string  | null | undefined): string | null {
  if (!value) return null;

  // Handle string input (common when DB returns raw date strings)
  if (typeof value === "string") {
      return new Date(value.replace(" ", "T") + "Z").toISOString();
  }

  // Ternary check prevents calling toISOString() on null/undefined (would throw)
  return value ? value.toISOString() : null;
}

/**
 * Extracts only the date portion ("YYYY-MM-DD") from various input types.
 *
 * Handles Drizzle ORM inconsistencies where `date` columns might return
 * a native `Date` object (in some modes) or a raw ISO string (in others).
 * Normalizes both to a standard "YYYY-MM-DD" format suitable for frontend
 * date pickers or display.
 *
 * @param value - Date object, ISO string, null, or undefined
 * @returns Date-only string (e.g., "2026-10-14") or null
 *
 * Logic:
 * - If string: slices first 10 chars (assumes ISO format "YYYY-MM-DDTHH...")
 * - If Date: converts to ISO then slices first 10 chars
 * - If falsy: returns null
 *
 * Example:
 * toDateOnly(new Date()) -> "2026-10-14"
 * toDateOnly("2026-10-14T15:30:00Z") -> "2026-10-14"
 * toDateOnly(null) -> null
 */
export function toDateOnly(value: Date | string | null | undefined): string | null {
  if (!value) return null;

  // Handle string input (common when DB returns raw date strings)
  if (typeof value === "string") {
    // Assumes ISO format; slice(0, 10) extracts "YYYY-MM-DD"
    return value.slice(0, 10);
  }

  // Handle Date object input
  // Convert to ISO string first, then extract date portion
  return value.toISOString().slice(0, 10);
}
