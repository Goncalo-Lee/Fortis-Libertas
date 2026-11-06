import type { NotificationRow } from "@/db/queries/notifications";
import { toIso } from "./common";

/** Notification as returned by the API (endpoints.md, section 4.2). */
export function serializeNotification(row: NotificationRow) {
  return {
    notification_id: row.id,
    type: row.type,
    data: row.data,
    created_at: toIso(row.createdAt),
    read_at: toIso(row.readAt),
  };
}
