import { and, asc, count, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import { activityLog, user } from "@/db/schema";

/* ======
  READ
======= */

/** Which log to read: a dashboard's, a bank account's, or the caller's own account events. */
export type LogOwner =
  | { scope: "dashboard"; dashboardId: string }
  | { scope: "bank_account"; bankAccountId: string }
  | { scope: "account"; userId: string };

export type ListActivityLogsFilters = {
  actions?: string[];
  entityType?: string;
  userId?: string;
  createdFrom?: Date;
  createdTo?: Date;
  sort: "created_at" | "-created_at";
  limit: number;
  offset: number;
};

/** WHERE clause that picks one log. The indexes (`dashboard_id`/`bank_account_id`/`user_id` + `created_at`) cover it. */
function ownerWhere(owner: LogOwner) {
  switch (owner.scope) {
    case "dashboard":
      return eq(activityLog.dashboardId, owner.dashboardId);
    case "bank_account":
      return eq(activityLog.bankAccountId, owner.bankAccountId);
    case "account":
      return and(eq(activityLog.scope, "account"), eq(activityLog.userId, owner.userId));
  }
}

/**
 * Page of a log, newest first by default, with who performed each action, plus the total for the pagination meta.
 * Entries are never deleted with the resource they describe (soft deletes keep them; endpoints.md, section 19.4).
 */
export async function listActivityLogs(owner: LogOwner, f: ListActivityLogsFilters) {
  const where = and(
    ownerWhere(owner),
    f.actions?.length ? inArray(activityLog.action, f.actions) : undefined,
    f.entityType ? eq(activityLog.entityType, f.entityType) : undefined,
    f.userId ? eq(activityLog.userId, f.userId) : undefined,
    f.createdFrom ? gte(activityLog.createdAt, f.createdFrom) : undefined,
    f.createdTo ? lte(activityLog.createdAt, f.createdTo) : undefined,
  );

  // The id (UUID v7, time ordered) breaks ties between entries of the same millisecond.
  const order = f.sort === "created_at"
    ? [asc(activityLog.createdAt), asc(activityLog.id)]
    : [desc(activityLog.createdAt), desc(activityLog.id)];

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: activityLog.id,
        scope: activityLog.scope,
        dashboardId: activityLog.dashboardId,
        bankAccountId: activityLog.bankAccountId,
        entityType: activityLog.entityType,
        entityId: activityLog.entityId,
        action: activityLog.action,
        metadata: activityLog.metadata,
        ipAddress: activityLog.ipAddress,
        userAgent: activityLog.userAgent,
        createdAt: activityLog.createdAt,
        user: { id: user.id, userName: user.username, fullName: user.name, image: user.image },
      })
      .from(activityLog)
      .innerJoin(user, eq(user.id, activityLog.userId))
      .where(where)
      .orderBy(...order)
      .limit(f.limit)
      .offset(f.offset),
    db.select({ total: count() }).from(activityLog).where(where),
  ]);

  return { rows, total };
}

export type ActivityLogRow = Awaited<ReturnType<typeof listActivityLogs>>["rows"][number];
