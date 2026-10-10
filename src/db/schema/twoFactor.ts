import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import { uuidBinary } from "../types";
import { user } from "./user";

/**
 * Two-Factor Authentication (2FA) Configuration Table
 *
 * Stores TOTP (Time-based One-Time Password) credentials for users who enable
 * 2FA on their accounts. Supports RFC 6238 compliant authenticator apps
 * (Google Authenticator, Authy, 1Password, Bitwarden, etc.)
 *
 * Security Architecture:
 * - ONE row per user (1:1 relationship with user table)
 * - TOTP secrets stored ENCRYPTED at rest (AES-256-GCM recommended)
 * - Backup codes generated one-time, displayed once, then hashed/deleted
 * - Failed attempt tracking prevents brute-force attacks
 * - Temporary lockout after threshold exceeded (brute force protection)
 * - ON DELETE CASCADE removes 2FA data when user deleted (GDPR compliance)
 *
 * ⚠️ CRITICAL: This table contains HIGH-VALUE targets for attackers
 * - Implement field-level encryption for secret and backup_codes
 * - Never log TOTP values or secrets in any circumstance
 * - Restrict database access to application servers only
 * - Consider HSM/KMS integration for production deployments
 */
export const twoFactor = mysqlTable("two_factor", {
  /**
   * Unique 2FA record identifier (UUID v7 binary)
   * - Internal reference ID for administrative operations
   * - PRIMARY KEY for direct lookups during auth challenges
   * - Not exposed externally; application-internal only
   * ⚠️ UUID provides no security benefit here; separate random token needed
   */
  id: uuidBinary("id").primaryKey(),

  /**
   * Foreign key to owning user (UUID binary)
   * - NOT NULL ensures every 2FA record has valid user association
   * - Type matches user.id (uuidBinary) for zero-cast FK relationship
   * - ON DELETE CASCADE removes 2FA data when user deleted
   * - 1:1 relationship enforced at application layer (unique userId)
   * ⚠️ Missing explicit UNIQUE constraint; add if enforcing single 2FA per user
   */
  userId: uuidBinary("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  /**
   * TOTP shared secret (base32 encoded)
   * - Generated during 2FA setup; scanned via QR code into authenticator app
   * - RFC 6238 compliant; 160-bit minimum entropy (typically 20 bytes / 32 base32 chars)
   * - CRITICAL: MUST be encrypted at rest (AES-256-GCM or similar)
   * - Stored in text format for base32 compatibility
   * - Used by TOTP algorithm to generate 6-digit codes (30-second validity window)
   * ⚠️ NEVER log this value; redact completely in error responses
   * ⚠️ Encrypt before DB insert; decrypt only during verification
   * ⚠️ Regenerate secret if compromise suspected (reset 2FA requires re-setup)
   */
  secret: t.text("secret").notNull(),

  /**
   * Recovery/backup codes (encrypted plaintext or hashed)
   * - One-time use codes provided during initial 2FA setup
   * - Typically 8–10 codes, each 8–12 alphanumeric characters
   * - Used when user loses access to authenticator device
   * - Displayed ONCE during setup; consumed when used
   * - STORAGE OPTIONS:
   *   Option A: Store encrypted plaintext (can regenerate consumed codes)
   *   Option B: Store hashes (cannot see unused codes; more secure)
   * - Recommended: Encrypt with user-specific key; delete after all consumed
   * ⚠️ Never display backup codes after initial setup screen
   * ⚠️ Implement code consumption tracking (mark used codes as invalid)
   * ⚠️ Require admin verification for backup code usage (audit trail)
   */
  backupCodes: t.text("backup_codes").notNull(),

  /**
   * Initial verification completion flag
   * - FALSE during 2FA setup (user scanning QR code)
   * - TRUE after user enters first valid TOTP code
   * - Controls whether 2FA is enforced on login flows
   * - FALSE allows completing setup; TRUE enforces 2FA challenge
   * - If user disables 2FA, set back to FALSE (keep secret for quick re-enable)
   * ⚠️ Require verified=true before marking account as having active 2FA
   * ⚠️ Session management: existing sessions don't require immediate 2FA re-challenge
   */
  verified: t.boolean("verified").notNull(),

  /**
   * Failed verification attempt counter
   * - Tracks consecutive incorrect TOTP code submissions
   * - Reset to 0 on successful verification
   * - Increments on each failed code check
   * - Triggers temporary lockout when threshold exceeded (e.g., 5 attempts)
   * - CRITICAL for brute-force attack prevention (TOTP has only 1M possible codes)
   * ⚠️ Implement exponential backoff: 1 min after 5 fails, 5 min after 10 fails
   * ⚠️ Consider IP-based tracking to prevent distributed attacks
   * ⚠️ Alert security team if count exceeds threshold repeatedly
   */
  failedVerificationCount: t.int("failed_verification_count")
    .notNull(),

  /**
   * Account lockout timestamp (UTC)
   * - Populated when failedVerificationCount exceeds threshold
   * - NULL = account not currently locked
   * - TIMESTAMP with DATE mode converts MySQL datetime to JS Date object
   * - FSP(3) supports millisecond precision for accurate timing
   * - Unlock automatically after duration elapses (e.g., 30 minutes)
   * - Better Auth checks this before allowing verification attempts
   * ⚠️ Clear failedVerificationCount upon unlock (fresh start)
   * ⚠️ Log lockout events for security monitoring/auditing
   * ⚠️ Consider manual unlock capability for admin support cases
   */
  lockedUntil: t.timestamp("locked_until", { mode: "date", fsp: 3 }),
}, (table) => [
  /**
   * User-based lookup index for 2FA records
   * - Critical performance optimization for login flows:
   *   • Retrieve 2FA config during authentication challenge
   *   • Validate TOTP secrets on every password + 2FA submission
   *   • Check lockout status before allowing verification attempts
   * - Without this index, queries require full table scan
   * - With millions of users, index reduces lookup from 1000ms → <5ms
   * - Named explicitly for migration clarity and EXPLAIN plan identification
   * ⚠️ Essential for production-scale auth systems (>10k users)
   */
  t.index("idx_two_factor_user_id").on(table.userId),
]);
