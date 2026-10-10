import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import { uuidBinary } from "../types";
import { timestamps } from "../columns";
import { user } from "./user";

/**
 * Session table for Better Auth session management
 *
 * Stores persistent user sessions supporting:
 * - Multi-device login tracking
 * - Session token rotation and revocation
 * - Activity auditing (IP, user agent capture)
 * - Automatic cleanup via TTL/indexed expiry queries
 *
 * Security considerations:
 * - Session tokens are stored hashed in application layer (never plain-text)
 * - CASCADE delete ensures orphaned sessions removed when users deleted
 * - Expiration index enables efficient cron jobs for expired session cleanup
 */
export const session = mysqlTable("session", {
  /**
   * Unique session identifier (UUID v7 binary)
   * - Mirrors user.id strategy: compact storage + temporal ordering
   * - PRIMARY KEY for session retrieval during auth middleware
   * - Internal use only; not exposed to client-side code
   */
  id: uuidBinary("id").primaryKey(),

  /**
   * Foreign key reference to owning user
   * - NOT NULL ensures every session has a valid user association
   * - ON DELETE CASCADE removes all sessions when user is deleted/soft-deleted
   * - TEXT(255+) accommodates UUID binary or string representation
   * - INDEX (session_userId_idx) enables fast queries: "find all sessions for user X"
   * ⚠️ Ensure user.id matches expected type (binary vs string)
   */
  userId: uuidBinary("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  /**
   * Session authentication token
   * - UNIQUE constraint prevents token collisions across all sessions
   * - Stored hashed (application layer handles hashing before persist)
   * - LENGTH(255) accommodates secure random tokens (e.g., 64+ hex chars)
   * - Indexed implicitly via UNIQUE; used for cookie-based session lookup
   * ⚠️ Never log or expose this value in error messages/logs
   * ⚠️ Implement token rotation on privilege elevation (e.g., 2FA enablement)
   */
  token: t.varchar("token", { length: 255 })
    .notNull()
    .unique(),

  /**
   * Session expiration timestamp (UTC)
   * - TIMESTAMP type with DATETIME semantics (mode: "date" converts to JS Date)
   * - FSP(3) precision supports millisecond-level expiry timing
   * - NOT NULL required for proper session lifecycle management
   * - Enable TTL-based cleanup: scheduled job deleting rows WHERE expires_at < NOW()
   * - Better Auth validates this on every session check to reject stale tokens
   */
  expiresAt: t.timestamp("expires_at", { mode: "date", fsp: 3 })
    .notNull(),

  /**
   * Client IP address at session creation
   * - Captured for security audit trails and anomaly detection
   * - TEXT accommodates IPv6 addresses (up to 45 chars)
   * - Useful for detecting credential stuffing/geo-impossible travel
   * - May be NULL behind proxy/load balancer if X-Forwarded-For not configured
   * ⚠️ Store original client IP, not load balancer IP (configure trusted proxies)
   */
  ipAddress: t.text("ip_address"),

  /**
   * Client User-Agent header
   * - Helps identify session device/browser for audit displays
   * - Enables device fingerprinting for suspicious activity detection
   * - Can be spoofed; use for informational purposes only (not security-critical)
   * - TEXT accommodates lengthy UA strings from modern browsers
   */
  userAgent: t.text("user_agent"),

  /**
   * Audit timestamp columns
   * - created_at: Session issuance time (used for session age calculations)
   * - updated_at: Last activity timestamp (extendable via "remember me" flows)
   * - Both populated automatically; essential for session timeout logic
   */
  ...timestamps,
}, (table) => [
  /**
   * Composite index for session queries by user
   * - Critical performance optimization for:
   *   • Listing active sessions per user (account settings page)
   *   • Revoking all sessions for a specific user (security feature)
   *   • Cleaning up expired sessions per user during account deletion
   * - Without this, queries would require full table scan on large datasets
   * - Named explicitly for easy identification in EXPLAIN plans
   * ⚠️ Not a composite index (single column); sufficient for common query patterns
   */
  t.index("session_userId_idx").on(table.userId),
]);
