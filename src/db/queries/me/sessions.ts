import { db } from "../..";
import { session } from "../../schema";
import { and, eq, ne, sql } from "drizzle-orm";

/* ======
  SESSIONS
======= */

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
        .where(eq(session.userId, sql`UUID_TO_BIN(${userId})`));

    return rows.map((s) => ({
        sessionId: s.id,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        isCurrent: s.id === currentSessionId,
    }));
}

export async function revokeOtherSessions(userId: string, currentSessionId: string) {
    await db
        .delete(session)
        .where(and(
            eq(session.userId, sql`UUID_TO_BIN(${userId})`),
            ne(session.id, currentSessionId)
        ));
}

export async function revokeSessionById(userId: string, targetSessionId: string) {
    await db
        .delete(session)
        .where(and(
            eq(session.userId, sql`UUID_TO_BIN(${userId})`),
            eq(session.id, targetSessionId)
        ));
}