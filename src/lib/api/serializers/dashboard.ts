import type { InferSelectModel } from "drizzle-orm";
import { dashboard } from "../../../db/schema";
import type { Role } from "../../../db/queries/dashboards";
import { toIso } from "./common";

// Inferred type of a raw dashboard row from the DB.
// Keeps the serializer in sync with schema changes automatically.
type DashboardRow = InferSelectModel<typeof dashboard>;

/**
 * Serializes a dashboard row into the API response shape.
 *
 * Unlike the user/profile serializers, this one takes two extra arguments:
 * - `role`: the requesting user's role, which is per-request context, not a
 *   column on the dashboard itself. It comes from the membership join.
 * - `memberCount`: optional; only included when the caller computed it,
 *   avoiding an extra COUNT query on endpoints that don't need it.
 *
 * @param row - Raw dashboard row
 * @param role - The requesting user's role on this dashboard
 * @param memberCount - Optional member count (omitted from output if undefined)
 * @returns API-shaped dashboard object
 */
export function serializeDashboard(row: DashboardRow, role: Role, memberCount?: number) {
  return {
    // Rename PK to `dashboard_id` for consistency with `user_id` elsewhere
    dashboard_id: row.id,
    name: row.name,
    is_active: row.isActive,

    // Per-user context: the requester's role (not stored on the dashboard)
    role,

    // Conditional spread: only include `member_count` when provided.
    // Omitting the key entirely (vs. sending null) keeps responses lean and
    // signals to clients that the value wasn't computed for this endpoint.
    ...(memberCount !== undefined && { member_count: memberCount }),

    // Audit timestamps normalized to ISO 8601 UTC
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  };
}
