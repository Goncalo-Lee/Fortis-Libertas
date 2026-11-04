import { and, eq, isNull } from "drizzle-orm";
import { db } from "../..";
import { notifications } from "../../schema";
import { generateId } from "../../types";
import type { Executor, NotificationType } from "./type";

/* =======
  WRITE
======== */

/**
 * Creates a notification for a user. Called by other queries, never by a route directly.
 *
 * Pass the transaction (`tx`) of the change that triggers it: if that change rolls back,
 * the notification rolls back with it, so a user is never told about something that did not happen.
 */
export async function createNotification(
  executor: Executor,
  userId: string,
  type: NotificationType,
  data: Record<string, unknown>,
) {
  await executor.insert(notifications).values({ id: generateId(), userId, type, data });
}

/**
 * Marks one of the user's notifications as read or unread.
 *
 * Marking as read keeps the first `read_at` (the `isNull` filter): reading it twice does not move the date.
 * The `userId` filter makes another user's notification look like it does not exist.
 *
 * @returns `true` if the notification exists and belongs to the user, `false` otherwise (-> 404)
 */
export async function setNotificationRead(userId: string, notificationId: string, read: boolean) {
  const mine = and(eq(notifications.id, notificationId), eq(notifications.userId, userId));

  const [existing] = await db.select({ id: notifications.id }).from(notifications).where(mine).limit(1);
  if (!existing) return false;

  if (read) {
    await db.update(notifications).set({ readAt: new Date() }).where(and(mine, isNull(notifications.readAt)));
  } else {
    await db.update(notifications).set({ readAt: null }).where(mine);
  }
  return true;
}

/** Marks every unread notification of the user as read. @returns how many changed */
export async function markAllNotificationsRead(userId: string) {
  const [result] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return result.affectedRows;
}

/** Physically deletes one of the user's notifications. @returns `false` if not found or not the user's (-> 404) */
export async function deleteNotification(userId: string, notificationId: string) {
  const [result] = await db
    .delete(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  return result.affectedRows > 0;
}
