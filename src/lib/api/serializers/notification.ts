import type { NotificationRow } from "@/db/queries/notifications";
import { toIso } from "./common";

/** Notification as returned by the API (endpoints.md, section 4.2). */
export function serializeNotification(row: NotificationRow) {
  const data = row.data as Record<string, any>;

  return {
    notification_id: row.id,
    type: row.type,
    title: data?.title || "",
    message: data?.message || "",
    data: row.data,
    is_read: !!row.readAt,
    created_at: toIso(row.createdAt),
    read_at: toIso(row.readAt),
  };
}
