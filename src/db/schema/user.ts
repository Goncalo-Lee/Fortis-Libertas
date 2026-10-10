import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import { booleanAsDatetime, uuidBinary } from "../types";
import { softDelete, timestamps } from "../columns";

/**
 * User table schema for Better Auth integration
 *
 * Core entity storing authenticated user identities and profile data.
 * Designed for production use with security-conscious defaults:
 * - UUID v7 primary keys for sequential, time-ordered IDs
 * - Soft delete pattern for audit trails and data recovery
 * - Boolean-as-DATETIME for email verification tracking
 * - Suspended account support for moderation workflows
 */
export const user = mysqlTable("user", {
  /**
   * Unique user identifier (UUID v7 binary)
   * - Binary storage minimizes index size vs VARCHAR(36)
   * - UUID v7 enables temporal ordering in B-tree indexes
   * - PRIMARY KEY with clustered index on MySQL InnoDB
   */
  id: uuidBinary("id").primaryKey(),

  /**
   * Display name for user profile
   * - Stores full name as provided by user (not system-generated)
   * - VARCHAR(254) accommodates international name lengths
   * - NOT NULL ensures all users have visible identity
   * - May contain spaces and special characters per Unicode
   */
  name: t.varchar("full_name", { length: 254 }).notNull(),

  /**
   * Unique username handle (optional)
   * - Used for @mentions, public profiles, or legacy auth systems
   * - UNIQUE constraint enforces global uniqueness at DB level
   * - NULLABLE allows users without handles (email-only accounts)
   * - Case sensitivity depends on collation (consider utf8mb4_general_ci)
   */
  username: t.varchar("user_name", { length: 254 }).unique(),

  /**
   * Primary email address for account identification
   * - NOT NULL enforced since email is primary login identifier
   * - UNIQUE constraint prevents duplicate registrations
   * - LENGTH(254) aligns with RFC 5321 max mailbox length
   * - Index created automatically for fast lookup during auth flows
   * ⚠️ Consider case-normalization trigger if lowercase enforcement needed
   */
  email: t.varchar("email", { length: 254 }).notNull().unique(),

  /**
   * Email verification timestamp (UTC DATETIME)
   * - NULL = unverified account
   * - DATETIME populated when user clicks verification link
   * - Uses booleanAsDatetime helper (stores true as current_timestamp)
   * - Enables verification checks in session middleware
   * - Better Auth reads this for `emailVerified` field mapping
   */
  emailVerified: booleanAsDatetime("email_verified_at"),

  /**
   * Avatar/profile image URL
   * - TEXT type accommodates long CDN/presigned URLs
   * - NULLABLE (users can use default avatars)
   * - Should store absolute HTTP(S) URLs, not relative paths
   * - Validate URL format before persistence in application layer
   */
  image: t.text("image"),

  /**
   * Two-factor authentication enablement flag
   * - DEFAULT false reduces attack surface for new accounts
   * - NOT NULL prevents undefined state in authorization checks
   * - Application layer enforces TOTP setup before enabling
   * - Better Auth uses this for 2FA flow gating
   */
  twoFactorEnabled: t.boolean("two_factor_enabled").notNull().default(false),

  /**
   * Account suspension timestamp (UTC DATETIME)
   * - NULL = active account
   * - Populated by admin/moderation tools
   * - Store suspension start time for audit/logging purposes
   * - FSP(3) precision supports millisecond-level event ordering
   * - Check this value before allowing authentication/transactions
   */
  suspendedAt: t.datetime("suspended_at", { fsp: 3 }),

  /**
   * Soft delete metadata (reversible deletion pattern)
   * - Adds deleted_at column (DATETIME)
   * - NULL = record exists, populated = logically deleted
   * - Preserves foreign key relationships across cascade deletes
   * - Query filters should exclude deleted records by default
   * - Enable with Drizzle's .where((t) => t.deleted_at.isNull())
   */
  ...softDelete,

  /**
   * Audit timestamp columns (created_at, updated_at)
   * - created_at: Record insertion time (immutable)
   * - updated_at: Last modification time (auto-updated via triggers or app)
   * - Both DATETIME with DEFAULT CURRENT_TIMESTAMP
   * - Essential for debugging, analytics, and sync operations
   */
  ...timestamps,
}, (table) =>
// Additional indexes for query performance optimization
//
// These indexes improve read query speed for common lookup patterns.
// Note: Each index adds overhead to INSERT/UPDATE/DELETE operations,
// so only include indexes matching your actual query patterns.
[
  /**
   * Username lookup index
   * - Supports fast queries filtering by username (e.g., @mentions, profile pages)
   * - UNIQUE constraint on `username` already creates an implicit index
   * - This explicit naming makes it easier to identify/drop later
   * - Useful when querying without the PRIMARY KEY
   */
  t.index("idx_user_user_name").on(table.username),

  /**
   * Email lookup index
   * - Critical for authentication flow (email/password lookups)
   * - UNIQUE constraint on `email` already creates an implicit index
   * - This explicit naming makes it easier to identify/drop later
   * - Most accessed column during login, password reset, session validation
   * ⚠️ Redundant with UNIQUE constraint, but improves migration clarity
   */
  t.index("idx_user_email").on(table.email),
]);
