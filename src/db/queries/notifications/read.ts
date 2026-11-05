import { and, asc, count, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "../..";
import { notifications } from "../../schema";
import type { ListNotificationsFilters } from "./type";

/* ======
  READ
======= */

const columns = {
  id: notifications.id,
  type: notifications.type,
  data: notifications.data,
  createdAt: notifications.createdAt,
  readAt: notifications.readAt,
};

/**
 * Page of the user's notifications plus the total for the pagination meta.
 * `unread: true` keeps only unread ones, `unread: false` only read ones, `undefined` all of them.
 */
export async function listNotifications(userId: string, filters: ListNotificationsFilters) {
  const where = and(
    eq(notifications.userId, userId),
    filters.unread === undefined ? undefined : filters.unread ? isNull(notifications.readAt) : isNotNull(notifications.readAt),
    filters.type ? eq(notifications.type, filters.type) : undefined,
  );

  // Newest first by default. The id (UUID v7, time ordered) breaks ties between rows created in the same millisecond.
  const order = filters.sort === "created_at"
    ? [asc(notifications.createdAt), asc(notifications.id)]
    : [desc(notifications.createdAt), desc(notifications.id)];

  const [rows, [{ total }]] = await Promise.all([
    db.select(columns).from(notifications).where(where).orderBy(...order).limit(filters.limit).offset(filters.offset),
    db.select({ total: count() }).from(notifications).where(where),
  ]);

  return { rows, total };
}

export type NotificationRow = Awaited<ReturnType<typeof listNotifications>>["rows"][number];

/** One notification of the user, or `null` (also when it belongs to someone else). */
export async function getNotification(userId: string, notificationId: string) {
  const [row] = await db
    .select(columns)
    .from(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .limit(1);
  return row ?? null;
}
/** Number of unread notifications, for the badge on the bell icon. */
export async function countUnreadNotifications(userId: string) {
    const [{unread}] = await db
        .select({unread: count()})
        .from(notifications)
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return unread;
}
