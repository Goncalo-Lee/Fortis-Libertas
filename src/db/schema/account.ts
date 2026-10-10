import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import { uuidBinary } from "../types";
import { timestamps } from "../columns";
import { user } from "./user";

/**
 * OAuth Provider Account Credentials Table (Better Auth)
 *
 * Stores third-party authentication credentials for social login providers
 * (Google, GitHub, Apple, Discord, etc.) and traditional password auth.
 *
 * Security Architecture:
 * - ONE row per USER × PROVIDER combination (users can link multiple accounts)
 * - Tokens encrypted at rest recommended (application layer encryption)
 * - Access/refresh tokens enable automatic OAuth token refresh flows
 * - ON DELETE CASCADE removes provider links when user deleted
 * - Unique compound constraint prevents duplicate provider accounts per user
 *
 * OAuth Flow Support:
 * - Authorization Code Grant (primary flow for secure web apps)
 * - Implicit/PKCE flows supported via token storage flexibility
 * - ID token validation for OpenID Connect providers (Google, Microsoft)
 * - Scope tracking for permission auditing and consent revocation
 */
export const account = mysqlTable("account", {
  /**
   * Unique account linkage identifier (UUID v7 binary)
   * - Independent from user.id and provider's accountId
   * - Allows managing credential rotation without affecting FK relationships
   * - PRIMARY KEY for direct credential lookup during token refresh
   * ⚠️ Not exposed externally; internal reference only
   */
  id: uuidBinary("id").primaryKey(),

  /**
   * Foreign key to owner user record
   * - NOT NULL ensures all accounts belong to valid user
   * - ON DELETE CASCADE removes linked accounts when user deleted
   * - Multiple accounts per user allowed (same user can use Google + GitHub)
   * - INDEX (idx_account_user_id) optimizes: "find all accounts for user X"
   * ⚠️ Use t.text() to match userId type in session table for consistency
   */
  userId: t.text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  /**
   * Third-party provider's unique account identifier
   * - Value comes from OAuth provider's user resource (e.g., "google_id_123")
   * - NOT NULL since every account must have external identity
   * - Combined with providerId forms unique constraint per user
   * - Used to match incoming OAuth callbacks to existing local accounts
   * ⚠️ Provider IDs change rarely but verify if provider supports ID rotation
   */
  accountId: t.text("account_id").notNull(),

  /**
   * OAuth provider identifier
   * - String enum or slug: "google", "github", "discord", "apple", etc.
   * - NOT NULL required; every account linked to a specific provider
   * - Case sensitivity depends on your provider config (recommend lowercase)
   * - Enables multi-provider support within single unified schema
   * ⚠️ Keep provider naming consistent with Better Auth's provider registry
   */
  providerId: t.text("provider_id").notNull(),

  /**
   * OAuth access token (short-lived)
   * - Used to authenticate API calls to provider on behalf of user
   * - Optional for read-only providers (some flows don't require)
   * - Store ENCRYPTED at rest (AES-256-GCM recommended)
   * - Expiry tracked via accessTokenExpiresAt for automatic refresh
   * ⚠️ Never log this value; mask in debug output (first 8 chars only)
   * ⚠️ Implement token rotation: refresh before expiry, invalidate old token
   */
  accessToken: t.text("access_token"),

  /**
   * OAuth refresh token (long-lived)
   * - Obtained during initial OAuth consent flow (requires offline_access scope)
   * - Exchange expired access tokens for new ones without user interaction
   * - HIGHLY SENSITIVE: treat like password equivalent
   * - Store ENCRYPTED at rest; consider hardware security modules for production
   * - Some providers rotate refresh tokens on each use (check provider docs)
   * ⚠️ If provider rotates refresh tokens, mark old ones invalid immediately
   */
  refreshToken: t.text("refresh_token"),

  /**
   * Access token expiration timestamp (UTC)
   * - TIMESTAMP with DATE mode converts MySQL datetime to JS Date object
   * - FSP(3) supports millisecond precision for accurate expiry timing
   * - NULL means non-expiring access token (rare; e.g., GitHub PATs)
   * - Enable proactive refresh: check expires_at > NOW() - BUFFER before use
   * - Better Auth uses this to decide whether to auto-refresh tokens
   */
  accessTokenExpiresAt: t.timestamp("access_token_expires_at", { mode: "date", fsp: 3 }),

  /**
   * Refresh token expiration timestamp (UTC)
   * - Many refresh tokens have long expiry (30–90 days) or indefinite life
   * - NULL = non-expiring refresh token (common in OAuth flows without expiry)
   * - Critical for detecting stale credentials that need re-authentication
   * ⚠️ Some providers (Google) don't expose refresh token expiry; use NULL
   */
  refreshTokenExpiresAt: t.timestamp("refresh_token_expires_at", { mode: "date", fsp: 3 }),

  /**
   * OAuth scope string
   * - Space-separated permissions granted during consent (e.g., "read:user user:email")
   * - Tracks what access level was originally approved by user
   * - Useful for: audit logs, re-requesting additional scopes, revocation UI
   * - NULL indicates minimal/default scope or provider doesn't track
   * - Normalize to sorted/alphabetical order for consistent comparison
   */
  scope: t.text("scope"),

  /**
   * OpenID Connect ID token (JWT)
   * - Contains verified identity claims (sub, email, name, etc.)
   * - Used for initial user profile population from provider
   * - Verify signature using provider's JWKS endpoint before storing
   * - Optional; not all OAuth providers issue ID tokens (non-OIDC flows)
   * ⚠️ Validate JWT structure and signature on every read (prevent tampering)
   * ⚠️ ID tokens expire quickly; don't rely on them for long-term auth
   */
  idToken: t.text("id_token"),

  /**
   * Password hash for traditional email/password authentication
   * - Stored as argon2id/bcrypt hash string (NOT plain-text password)
   * - Optional because some users only use OAuth (no password set)
   * - NULL = passwordless account (OAuth-only login)
   * ⚠️ CRITICAL: Enforce strong hashing algorithm (never MD5/sha1)
   * ⚠️ Validate password strength requirements at application layer
   * ⚠️ Implement rate limiting on password verification to prevent brute force
   */
  password: t.text("password"),

  /**
   * Audit timestamp columns
   * - created_at: Initial account linkage creation time
   * - updated_at: Last credential update (token refresh, password change)
   * - Monitor updated_at for credential rotation monitoring
   * - Track credential age for periodic re-authentication policies
   */
  ...timestamps,
}, (table) => [
  /**
   * User association index for account queries
   * - Optimizes: "list all connected accounts for a user" (settings page)
   * - Enables fast: "delete all accounts for user" (GDPR data removal)
   * - Supports: "count connected providers per user" (security audit)
   * - Without this index, queries require full table scan on growing datasets
   * - Named explicitly for migration clarity and EXPLAIN plan identification
   * ⚠️ Consider composite index (userId, providerId) for multi-filter queries
   */
  t.index("idx_account_user_id").on(table.userId),
]);
