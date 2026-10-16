import { z } from "zod";
import { ApiError } from "./errors";

// Zod schema for GUID/UUID validation.
// .guid() validates standard UUID formats (v1-v5) and normalizes casing.
const uuid = z.guid();

/**
 * Validates and normalizes a path parameter expected to be a UUID.
 *
 * Critical for security and data integrity:
 * 1. Prevents SQL injection or malformed IDs from reaching the database layer.
 * 2. Ensures case-insensitivity (UUIDs are case-agnostic, but DBs may be case-sensitive).
 * 3. Provides a consistent error signal (400) instead of letting the DB throw a cryptic error.
 *
 * @param value - The raw string extracted from the URL path (e.g., ":id")
 * @returns The normalized lowercase UUID string
 * @throws ApiError("MALFORMED_REQUEST", 400) if the value is not a valid UUID
 *
 * Example:
 * parseUuid("550e8400-e29b-41d4-a716-446655440000") -> "550e8400-e29b-41d4-a716-446655440000"
 * parseUuid("INVALID-ID") -> throws ApiError(400)
 * parseUuid("550E8400...") -> "550e8400..." (lowercased)
 */
export function parseUuid(value: string): string {
  // safeParse avoids throwing immediately, allowing us to control the error type
  const result = uuid.safeParse(value);

  if (!result.success) {
    // If validation fails, surface a clear 400 error.
    // This stops the request before it hits the DB, preventing wasted work.
    throw new ApiError("MALFORMED_REQUEST", "Path parameter is not a valid UUID.");
  }

  // Return the normalized (lowercase) UUID.
  // Drizzle/SQL usually accepts mixed case, but normalizing ensures consistency
  // in logs and prevents duplicate lookups due to case differences.
  return result.data.toLowerCase();
}
