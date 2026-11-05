import { and, desc, eq, gt, ne } from "drizzle-orm";
import { db } from "../..";
import { session } from "../../schema";
import { logActivity } from "../activity-logs/write";

/* ======
  SESSIONS
======= */

/*
 * Sessions of the caller (endpoints.md, section 3.6). Rows are created by Better Auth; here they are only
 * listed and revoked. Revoking = deleting the row, so the token stops working on the next request.
 * The `token` column is never selected.
 */

/**
 * Active (not expired) sessions of a user, newest first, marking the one making the request.
 *
 * @param userId - The caller
 * @param currentSessionId - Session of the current request, used for `isCurrent`
 */
export async function listSessions(userId: string, currentSessionId: string) {
  const rows = await db
    .select({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    })
    .from(session)
    .where(and(eq(session.userId, userId), gt(session.expiresAt, new Date())))
    .orderBy(desc(session.createdAt));

  const current = currentSessionId.toLowerCase();
  return rows.map((row) => ({ ...row, isCurrent: String(row.id).toLowerCase() === current }));
}

export type SessionRow = Awaited<ReturnType<typeof listSessions>>[number];

/** Deletes every session of the user except the current one ("sign out everywhere else"). */
export async function revokeOtherSessions(userId: string, currentSessionId: string) {
  await db.transaction(async (tx) => {
    const [result] = await tx.delete(session).where(and(eq(session.userId, userId), ne(session.id, currentSessionId)));
    if (result.affectedRows > 0) {
      await logActivity(tx, {
        scope: "account", userId, entityType: "session", action: "sessions_revoked",
        metadata: { count: result.affectedRows },
      });
    }
  });
}

/**
 * Deletes one session of the user.
 *
 * The `userId` filter is what stops a user from revoking someone else's session: an id that belongs to
 * another user simply matches no row.
 *
 * @returns `true` if a row was deleted, `false` if the session does not exist or is not the user's
 */
export async function revokeSessionById(userId: string, targetSessionId: string) {
  return db.transaction(async (tx) => {
    const [result] = await tx
      .delete(session)
      .where(and(eq(session.userId, userId), eq(session.id, targetSessionId)));
    if (result.affectedRows === 0) return false;

    await logActivity(tx, { scope: "account", userId, entityType: "session", entityId: targetSessionId, action: "session_revoked" });
    return true;
  });
}
