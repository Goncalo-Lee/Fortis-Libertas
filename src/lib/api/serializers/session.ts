import type { SessionRow } from "@/db/queries/me/sessions";
import { toIso } from "./common";

/** Session as returned by GET /me/sessions (endpoints.md, section 3.6). `token` never leaves the database. */
export function serializeSession(row: SessionRow) {
  return {
    session_id: row.id,
    ip_address: row.ipAddress,
    user_agent: row.userAgent,
    expires_at: toIso(row.expiresAt),
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
    is_current: row.isCurrent,
  };
}
