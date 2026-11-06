import type { NextRequest } from "next/server";
import { changeMemberRole, getMember, removeMember } from "@/db/queries/dashboard-members";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { noContent, ok } from "@/lib/api/responses";
import { updateMemberSchema } from "@/lib/api/schemas/member";
import { serializeMember } from "@/lib/api/serializers/member";

// Force Node.js runtime for MySQL driver compatibility.
export const runtime = "nodejs";

// Route params now include both dashboard_id and user_id.
type Ctx = { params: Promise<{ dashboard_id: string; user_id: string }> };

/**
 * PATCH /api/dashboards/:id/members/:userId
 *
 * Changes a member's role (e.g., viewer -> editor).
 *
 * Authorization: "owner" only.
 * Only owners can grant or revoke privileges.
 *
 * Errors:
 * - 400 MALFORMED_REQUEST (bad UUIDs)
 * - 403 FORBIDDEN (not an owner)
 * - 409 LAST_OWNER (if demoting the last owner)
 * - 409 DASHBOARD_INACTIVE (default for owners: cannot modify inactive dashboards)
 * - 404 NOT_FOUND (if member was deleted concurrently)
 */
export const PATCH = withErrors(async (request: NextRequest, { params }: Ctx) => {
  // 1. Parse both UUIDs
  const { dashboard_id, user_id } = await params;
  const dashboardId = parseUuid(dashboard_id);
  const userId = parseUuid(user_id);

  // 2. Authorize — requires owner role.
  //    Note: Does NOT pass requireActive: false, so owners cannot change roles
  //    on inactive dashboards. To reactivate, they must first PATCH the dashboard itself.
  await requireDashboardRole(request, dashboardId, "owner");

  // 3. Validate body — only `role` is allowed
  const { role } = await parseJson(request, updateMemberSchema);

  // 4. Execute role change (transactional, handles LAST_OWNER invariant)
  await changeMemberRole(dashboardId, userId, role);

  // 5. Read back the updated member (with joined user data)
  const member = await getMember(dashboardId, userId);
  if (!member) throw new ApiError("NOT_FOUND"); // Race condition guard

  // 6. Return updated state
  return ok(serializeMember(member));
});

/**
 * DELETE /api/dashboards/:id/members/:userId
 *
 * Removes a member from a dashboard (or allows a user to leave).
 *
 * Authorization Logic:
 * - Minimum role: "viewer" — ANY member can access this endpoint.
 * - If removing SELF: Allowed for any role (viewer, editor, owner).
 * - If removing OTHER: Requires "owner" role.
 *
 * This pattern supports "Leave Dashboard" (self-service) without exposing
 * a separate endpoint, while preventing users from kicking others.
 *
 * Errors:
 * - 400 MALFORMED_REQUEST (bad UUIDs)
 * - 403 FORBIDDEN (trying to kick someone else as non-owner)
 * - 409 LAST_OWNER (if removing the last owner)
 * - 409 DASHBOARD_INACTIVE (requireActive: true blocks leaving inactive dashboards?)
 *   Wait: If requireActive is true, a user cannot leave an inactive dashboard.
 *   Is that intended? Usually "leaving" should be allowed anytime.
 *   See note below.
 */
export const DELETE = withErrors(async (request: NextRequest, { params }: Ctx) => {
  // 1. Parse UUIDs
  const { dashboard_id, user_id } = await params;
  const dashboardId = parseUuid(dashboard_id);
  const userId = parseUuid(user_id);

  // 2. Authorize — minimum "viewer" to allow self-leaving.
  //    CRITICAL: requireActive: true means users CANNOT leave inactive dashboards.
  //    If the goal is to allow users to "abandon" a dead dashboard, this should be false.
  const { session, role } = await requireDashboardRole(request, dashboardId, "viewer", {
    requireActive: true, // ⚠️ Potential Logic Trap: Blocks leaving inactive dashboards
  });

  // 3. Determine if the requester is removing themselves or someone else
  const isSelf = session.user.id.toLowerCase() === userId;

  // 4. Enforce privilege escalation check
  //    - Self: OK (any role)
  //    - Other: Must be owner
  if (!isSelf && role !== "owner") throw new ApiError("FORBIDDEN");

  // 5. Execute removal (transactional, handles LAST_OWNER invariant)
  await removeMember(dashboardId, userId);

  // 6. 204 No Content
  return noContent();
});
