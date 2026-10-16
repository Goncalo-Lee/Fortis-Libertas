import type { InferSelectModel } from "drizzle-orm";
import { user, profile } from "../../../db/schema";
import { toDateOnly, toIso } from "./common";

// Type representing the raw database row for 'user' table.
// Extends the inferred Drizzle model with a specific override for emailVerified
// to handle cases where the DB driver returns Date objects or ISO strings inconsistently.
type UserRow = Omit<InferSelectModel<typeof user>, "emailVerified"> & {
  emailVerified: Date | string | null;
};

// Type representing the raw database row for 'profile' table.
// Uses the standard inferred type from Drizzle.
type ProfileRow = InferSelectModel<typeof profile>;

/**
 * Serializes a raw database 'profile' row into a safe, standardized API response object.
 *
 * Transforms internal database field names (camelCase) to API conventions (snake_case).
 * Applies date formatting utilities to ensure consistent UTC ISO strings or date-only strings.
 * Handles null/undefined values gracefully via the helper functions.
 *
 * @param row - Raw row from the 'profile' table query
 * @returns Formatted object ready for JSON serialization
 *
 * Transformation Map:
 * - birthDate (DB) -> birth_date (API) [Date -> "YYYY-MM-DD"]
 * - phoneVerifiedAt (DB) -> phone_verified_at (API) [Date/String -> ISO String]
 * - createdAt/updatedAt -> created_at/updated_at (API) [Date -> ISO String]
 */
export function serializeProfile(row: ProfileRow) {
  return {
    // Convert birth date to "YYYY-MM-DD" format (strips time component)
    birth_date: toDateOnly(row.birthDate),

    // Phone number passed through as-is (assuming validated upstream)
    phone: row.phone,

    // Convert verification timestamp to full ISO 8601 string
    phone_verified_at: toIso(row.phoneVerifiedAt),

    // Pass through enum/string fields directly
    currency: row.currency,
    language: row.language,

    // Standard audit timestamps converted to ISO strings
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  };
}

/**
 * Serializes combined 'user' and 'profile' rows into a single nested API response object.
 *
 * Performs several critical transformations:
 * 1. Renames primary key 'id' to 'user_id' for clarity in nested contexts.
 * 2. Maps internal camelCase fields to snake_case API convention.
 * 3. Handles the special 'emailVerifiedRaw' type union (Date | string | null).
 * 4. Embeds the serialized profile object under a 'profile' key.
 *
 * @param row - Raw 'user' table row
 * @param profileRow - Raw 'profile' table row (joined or fetched separately)
 * @returns Nested object structure { user: ..., profile: ... }
 *
 * Security Note:
 * Fields like 'two_factor_enabled' and 'suspended_at' are exposed intentionally
 * to allow clients to adjust UI state (e.g., hide 2FA setup button if enabled).
 * Ensure these are safe to expose based on your privacy policy.
 */
export function serializeUser(row: UserRow, profileRow: ProfileRow) {
  return {
    // Rename 'id' to 'user_id' to avoid ambiguity when nested
    user_id: row.id,
    user_name: row.userName,
    full_name: row.name,
    email: row.email,

    // Special handling for emailVerified which might be Date or string
    email_verified_at: toIso(row.emailVerified),

    image: row.image,
    two_factor_enabled: row.twoFactorEnabled,

    // Account status flags
    suspended_at: toIso(row.suspendedAt),

    // Audit timestamps
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),

    // Nest the serialized profile data
    profile: serializeProfile(profileRow),
  };
}
