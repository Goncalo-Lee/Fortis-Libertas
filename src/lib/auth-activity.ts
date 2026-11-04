import { db } from "@/db";
import { logActivity } from "@/db/queries/activity-logs/write";
import { clientIp } from "@/lib/api/request-context";

/**
 * Account events of the activity log that happen inside Better Auth (endpoints.md, section 19.4):
 * sign-up, sign-in, sign-out, password change and 2FA changes. Wired in `lib/auth.ts` through `databaseHooks`.
 *
 * Why databaseHooks: they run when Better Auth writes a session, account or user row, and receive that row
 * (so we know WHO) plus the endpoint context (so we know WHY, from `path`).
 *
 * Exception to "same transaction": Better Auth does not share its transaction, so these entries are written right
 * after its write. A failure here is logged to the console and swallowed: losing one log line is better than
 * failing a sign-in that already happened.
 */

/** The parts of Better Auth's endpoint context that we use. `null` when Better Auth is called without a request. */
type AuthHookContext = { path?: string; headers?: Headers; request?: Request } | null;

function device(ctx: AuthHookContext) {
  const headers = ctx?.headers ?? ctx?.request?.headers;
  return { ipAddress: headers ? clientIp(headers) : null, userAgent: headers?.get("user-agent") ?? null };
}

async function logAccountEvent(userId: string, action: string, ctx: AuthHookContext, extra: {
  entityType: string; entityId?: string; metadata?: Record<string, unknown>; ipAddress?: string | null; userAgent?: string | null;
}) {
  try {
    await logActivity(db, { ...device(ctx), ...extra, scope: "account", userId, action });
  } catch (error) {
    console.error(`Activity log for ${action} failed:`, error);
  }
}

/** session.create.after: a session is born on sign-up (auto sign-in), on every sign-in and after 2FA. */
export async function onSessionCreated(
  session: { id: string; userId: string; ipAddress?: string | null; userAgent?: string | null },
  ctx: AuthHookContext,
) {
  const path = ctx?.path ?? "";
  await logAccountEvent(session.userId, path.startsWith("/sign-up") ? "sign_up" : "sign_in", ctx, {
    entityType: "session",
    entityId: session.id,
    // How the user signed in: "/sign-in/email", "/callback/google", "/two-factor/verify-totp"...
    metadata: { method: path || null },
    // Better Auth already stored the device on the session: use exactly that.
    ipAddress: session.ipAddress ?? undefined,
    userAgent: session.userAgent ?? undefined,
  });
}

/** session.delete.after: only an explicit sign-out is logged (expired sessions are cleaned up silently). */
export async function onSessionDeleted(session: { id: string; userId: string }, ctx: AuthHookContext) {
  if (ctx?.path !== "/sign-out") return;
  await logAccountEvent(session.userId, "sign_out", ctx, { entityType: "session", entityId: session.id });
}

const PASSWORD_PATHS = new Set(["/change-password", "/reset-password", "/set-password"]);

/**
 * account.update.after: the `credential` account holds the password hash, so an update to it on one of the
 * password endpoints is a password change. Social accounts (Google) are updated on token refresh and are ignored.
 */
export async function onAccountUpdated(account: { userId: string; providerId: string }, ctx: AuthHookContext) {
  if (account.providerId !== "credential" || !PASSWORD_PATHS.has(ctx?.path ?? "")) return;
  await logAccountEvent(account.userId, "password_changed", ctx, {
    entityType: "account",
    metadata: { method: ctx?.path === "/reset-password" ? "reset" : "change" },
  });
}

/**
 * user.update.after: 2FA is switched on when the first code is verified (`/two-factor/verify-totp` while signed in,
 * or `/two-factor/enable` when verification is skipped) and off on `/two-factor/disable`.
 * The user row tells which state it ended in, so a no-op never logs a wrong event.
 */
export async function onUserUpdated(user: { id: string; twoFactorEnabled?: boolean | null }, ctx: AuthHookContext) {
  const path = ctx?.path ?? "";
  if (!path.startsWith("/two-factor/")) return;

  if (path === "/two-factor/disable" && !user.twoFactorEnabled) {
    await logAccountEvent(user.id, "two_factor_disabled", ctx, { entityType: "two_factor" });
  } else if ((path === "/two-factor/enable" || path === "/two-factor/verify-totp") && user.twoFactorEnabled) {
    await logAccountEvent(user.id, "two_factor_enabled", ctx, { entityType: "two_factor" });
  }
}
