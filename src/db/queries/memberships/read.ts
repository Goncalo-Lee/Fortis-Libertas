import { and, asc, count, eq, isNull } from "drizzle-orm";
import { db } from "../..";
import { user } from "../../schema";
import { Membership, MemberRow } from "./type";

/* ======
  READ
======= */

const memberColumns = (m: Membership) => ({
  userId: m.table.userId,
  role: m.table.role,
  createdAt: m.table.createdAt,
  updatedAt: m.table.updatedAt,
  userName: user.username,
  fullName: user.name,
  image: user.image,
});

/** Predicate for an active (non-removed) membership of a user in a scope. */
export const activeMember = (m: Membership, scopeId: string, userId: string) =>
  and(eq(m.scopeId, scopeId), eq(m.table.userId, userId), isNull(m.table.deletedAt));

/** One active member with the user data joined, or `null` (also when the user account is deleted). */
export async function getMember(m: Membership, scopeId: string, userId: string) {
  const [row] = await db
    .select(memberColumns(m))
    .from(m.table)
    .innerJoin(user, eq(user.id, m.table.userId))
    .where(and(activeMember(m, scopeId, userId), isNull(user.deletedAt)))
    .limit(1);

  return (row ?? null) as MemberRow | null;
}

/** Page of active members (oldest first) and the total, for pagination. */
export async function listMembers(m: Membership, scopeId: string, limit: number, offset: number) {
  const where = and(eq(m.scopeId, scopeId), isNull(m.table.deletedAt), isNull(user.deletedAt));

  const rows = await db
    .select(memberColumns(m))
    .from(m.table)
    .innerJoin(user, eq(user.id, m.table.userId))
    .where(where)
    .orderBy(asc(m.table.createdAt), asc(m.table.userId))
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db
    .select({ total: count() })
    .from(m.table)
    .innerJoin(user, eq(user.id, m.table.userId))
    .where(where);

  return { rows: rows as MemberRow[], total: totalRow?.total ?? 0 };
}
