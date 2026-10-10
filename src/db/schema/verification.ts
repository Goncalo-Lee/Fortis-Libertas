import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import { uuidBinary } from "../types";
import { timestamps } from "../columns";

/**
 * Verification Token Table (Better Auth)
 *
 * Stores one-time verification codes/tokens for:
 * - Email verification (new account signups)
 * - Password reset flows
 * - Magic link authentication
 * - Phone/SMS verification codes
 * - Account recovery OTPs
 *
 * Security Architecture:
 * - Short-lived tokens (typically 15–60 minutes expiry)
 * - One-time use: tokens deleted/invalidated after verification
 * - Identifier groups tokens by purpose (email vs password vs phone)
 * - Automatic cleanup via expiry index prevents data accumulation
 * - Random high-entropy values prevent brute-force prediction
 *
 * Important: Store tokens HASHED in database (same principle as passwords)
 * - Raw token sent to user via email/SMS
 * - Hashed value stored in DB for comparison
 * - Prevents token theft via SQL injection or data breaches
 */
export const verification = mysqlTable("verification", {
  /**
   * Unique verification record identifier (UUID v7 binary)
   * - Internal reference ID for token management operations
   * - PRIMARY KEY for direct lookups when revoking/expiring tokens
   * - Not exposed to users; used only in application logic
   * ⚠️ UUID v7 provides temporal ordering but not security (use cryptographically random token separately)
   */
  id: uuidBinary("id").primaryKey(),

  /**
   * Verification purpose/type identifier
   * - String categorizing what this token verifies:
   *   • "email" — account email verification
   *   • "password-reset" — password recovery flow
   *   • "magic-link" — passwordless authentication
   *   • "phone" — SMS verification codes
   *   • "custom:{name}" — application-specific verifications
   * - VARCHAR(191) supports MySQL utf8mb4 index limit (255 chars × 4 bytes = 1020 max, 191 safe for indexes)
   * - NOT NULL required; every verification must have clear purpose
   * - INDEX (idx_verification_identifier) optimizes queries by verification type
   * ⚠️ Normalize identifiers to lowercase before storage for consistent matching
   */
  identifier: t.varchar("identifier", { length: 191 }).notNull(),

  /**
   * Verification token/value (HASHED)
   * - Contains the actual verification code or hash
   * - For email verification: hashed version of random 32-char token
   * - For password reset: hashed reset token (never store plain-text!)
   * - For magic links: signed JWT or opaque random string
   * - TEXT accommodates long hashes (SHA-256 = 64 hex chars, JWT ≈ 200–300 chars)
   * - NOT NULL enforced since verification is meaningless without token
   * ⚠️ CRITICAL SECURITY: ALWAYS hash before storing (bcrypt/argon2/sha256)
   * ⚠️ Never log this value; redact in error messages and debug output
   */
  value: t.text("value").notNull(),

  /**
   * Token expiration timestamp (UTC)
   * - TIMESTAMP with DATE mode converts MySQL datetime to JS Date object
   * - FSP(3) supports millisecond precision for accurate expiry timing
   * - NOT NULL required; unverifiable forever tokens are security risk
   * - Typical expiry windows:
   *   • Email verification: 24 hours
   *   • Password reset: 1 hour
   *   • Magic link: 15 minutes
   *   • SMS OTP: 5–10 minutes
   * - INDEX (idx_verification_expires_at) enables efficient cleanup queries
   * - Better Auth uses this to reject expired verification attempts
   * ⚠️ Expired tokens should be purged regularly (daily cron job recommended)
   */
  expiresAt: t.timestamp("expires_at", { mode: "date", fsp: 3 })
    .notNull(),

  /**
   * Audit timestamp columns
   * - created_at: Token issuance time (used for age tracking)
   * - updated_at: Last modification (rarely updated; immutable by design)
   * - Monitor created_at vs expiresAt for abnormal token lifespans
   * - Useful for debugging failed verification attempts
   */
  ...timestamps,
}, (table) => [
  /**
   * Identifier-based lookup index
   * - Optimizes queries filtering by verification type:
   *   • "Find all pending email verifications"
   *   • "Count password-reset tokens issued in last hour"
   *   • "Clean up expired magic-link tokens"
   * - Enables efficient GROUP BY identifier for analytics
   * - Named explicitly for migration clarity and EXPLAIN plan identification
   * ⚠️ Consider composite index (identifier, expiresAt) for combined filters
   */
  t.index("idx_verification_identifier").on(table.identifier),

  /**
   * Expiry-based cleanup index
   * - Critical for scheduled token purging jobs:
   *   • Daily cron: DELETE FROM verification WHERE expiresAt < NOW()
   * - Without this index, cleanup queries require full table scan
   * - As table grows (thousands of tokens), index reduces cleanup from seconds to milliseconds
   * - Enables efficient "get all expiring soon" queries for proactive notifications
   * ⚠️ Low selectivity if many tokens share same expiry; consider composite index
   */
  t.index("idx_verification_expires_at").on(table.expiresAt),
]);
