import { user } from "./user";
import { session } from "./session";
import { account } from "./account";
import { twoFactor } from "./twoFactor";
import { relations } from "drizzle-orm/_relations";

/**
 * User Table Relations Definition (Drizzle ORM)
 *
 * Declares one-to-many relationships between the user table and child tables.
 * Enables Drizzle to automatically join and fetch related data when querying users.
 *
 * Relationship Summary:
 * - user ↔ session: One user can have multiple active sessions (multi-device login)
 * - user ↔ account: One user can link multiple OAuth provider accounts
 * - user ↔ twoFactor: One user has exactly one 2FA configuration (1:1 modeled as 1:M)
 *
 * ⚠️ IMPORTANT: This file DOES NOT enforce referential integrity
 * - Foreign keys are defined in the table schemas (*.references())
 * - This file only enables Drizzle's relation helpers (.include(), .with())
 * - Cascade deletes are handled by MySQL, not Drizzle relations
 */
export const userRelations = relations(user, ({ many }) => ({
    /**
     * Sessions relationship (one-to-many)
     * - User can have multiple concurrent login sessions
     * - Each session stored in session table with FK userId
     * - Enables queries: "get all sessions for user" (dashboard view)
     * - Enables queries: "revoke all sessions" (security feature)
     *
     * Query Example:
     *   const userWithSessions = await db.query.users.findFirst({
     *     where: eq(users.id, userId),
     *     with: { sessions: true },
     *   });
     *
     * Result Structure:
     *   {
     *     id: string,
     *     name: string,
     *     sessions: Array<{ id, token, expiresAt, ... }>
     *   }
     *
     * ⚠️ Performance: Large session counts (100+) may cause memory pressure
     * ⚠️ Consider pagination for listing sessions in UI
     */
    sessions: many(session),

    /**
     * Accounts relationship (one-to-many)
     * - User can link multiple OAuth providers (Google + GitHub + Discord)
     * - Each account stored in account table with FK userId
     * - Enables queries: "list connected accounts" (settings page)
     * - Enables queries: "disconnect specific provider" (revoke access)
     *
     * Query Example:
     *   const userWithAccounts = await db.query.users.findFirst({
     *     where: eq(users.id, userId),
     *     with: { accounts: true },
     *   });
     *
     * Result Structure:
     *   {
     *     id: string,
     *     email: string,
     *     accounts: Array<{ id, providerId, accountId, ... }>
     *   }
     *
     * ⚠️ Security: Never serialize accessToken/refreshToken to frontend
     * ⚠️ Mask sensitive fields in application layer before sending to client
     */
    accounts: many(account),

    /**
     * Two-Factor Authentication relationship (one-to-one modeled as one-to-many)
     * - Technically 1:1 (user has one 2FA config), but Drizzle requires many() for FK tables
     * - Use .limit(1) or unique constraint on account side to enforce 1:1 at app layer
     * - Enables queries: "check if user has 2FA enabled" (account security status)
     * - Enables queries: "get 2FA config for verification challenge"
     *
     * Query Example:
     *   const userWith2FA = await db.query.users.findFirst({
     *     where: eq(users.id, userId),
     *     with: { twoFactors: true },
     *   });
     *
     * Result Structure:
     *   {
     *     id: string,
     *     twoFactors: [{ id, secret, verified, failedVerificationCount, ... }]
     *   }
     *
     * Note: twoFactors will be empty array [] if user hasn't set up 2FA
     *       (foreign key is NOT NULL, so 2FA row must exist when created)
     * ⚠️ Missing 2FA row = 2FA not configured (handle gracefully in auth logic)
     * ⚠️ Consider optional .optional() if 2FA table is truly optional
     */
    twoFactors: many(twoFactor),
}));

export const sessionRelations = relations(session, ({ one }) => ({
    /**
     * Parent user reference (inverse of user.sessions)
     * - Links session back to owner user
     * - Enables queries: "get user details for a session" (auth middleware)
     * - Query example:
     *   const sessionWithUser = await db.query.session.findFirst({
     *     where: eq(session.token, token),
     *     with: { user: true },
     *   });
     */
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

export const accountRelations = relations(account, ({ one }) => ({
    /**
     * Parent user reference (inverse of user.accounts)
     * - Links OAuth account back to owner user
     * - Enables queries: "get user profile.ts from OAuth callback"
     * - Query example:
     *   const accountWithUser = await db.query.account.findFirst({
     *     where: and(eq(account.providerId, 'google'), eq(account.accountId, externalId)),
     *     with: { user: true },
     *   });
     */
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
    /**
     * Parent user reference (inverse of user.twoFactors)
     * - Links 2FA config back to owner user
     * - Enables queries: "get user info during 2FA challenge"
     * - Query example:
     *   const twoFAWithUser = await db.query.twoFactor.findFirst({
     *     where: eq(twoFactor.userId, userId),
     *     with: { user: true },
     *   });
     */
    user: one(user, {
        fields: [twoFactor.userId],
        references: [user.id],
    }),
}));
