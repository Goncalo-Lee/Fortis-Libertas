import type { ActivityLogRow } from "@/db/queries/activity-logs";
import { toIso } from "./common";

/**
 * Activity log entry as returned by the API (endpoints.md, section 19.2).
 *
 * `ip_address` and `user_agent` are only returned on GET /me/activity-logs (`withDevice: true`), i.e. only to the
 * person who performed the action. A dashboard owner sees who did what, but not from which device.
 */
export function serializeActivityLog(row: ActivityLogRow, { withDevice = false } = {}) {
  return {
    activity_log_id: row.id,
    user: {
      user_id: row.user.id,
      user_name: row.user.userName,
      full_name: row.user.fullName,
      image: row.user.image,
    },
    scope: row.scope,
    dashboard_id: row.dashboardId,
    bank_account_id: row.bankAccountId,
    entity_type: row.entityType,
    entity_id: row.entityId,
    action: row.action,
    metadata: row.metadata ?? null,
    ...(withDevice ? { ip_address: row.ipAddress, user_agent: row.userAgent } : {}),
    created_at: toIso(row.createdAt),
  };
}
