import type { NextRequest } from "next/server";
import { countMembers, softDeleteDashboard, updateDashboard } from "@/db/queries/dashboards";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { noContent, ok } from "@/lib/api/responses";
import { updateDashboardSchema } from "@/lib/api/schemas/dashboard";
import { serializeDashboard } from "@/lib/api/serializers/dashboard";

// Force Node.js runtime for MySQL driver compatibility.
export const runtime = "nodejs";

// Type definition for Next.js route params (now a Promise in newer versions).
type Ctx = { params: Promise<{ dashboard_id: string }> };

/**
 * GET /api/dashboards/:id
 *
 * Returns the full details of a specific dashboard.
 *
 * Authorization: Viewer role (lowest threshold).
 * Includes member count (requires an extra query, justified for detail views).
 *
 * Errors:
 * - 400 MALFORMED_REQUEST (invalid UUID)
 * - 401 UNAUTHENTICATED / 403 ACCOUNT_SUSPENDED
 * - 404 NOT_FOUND (dashboard doesn't exist or user not a member)
 * - 409 DASHBOARD_INACTIVE (if dashboard is inactive and user is not owner/editor?
 *   Wait, `requireDashboardRole` defaults to blocking inactive for non-viewers.
 *   Since this is "viewer", it might allow viewing inactive?
 *   Let's check the logic: `requireActive ?? minRole !== "viewer"`.
 *   Here `minRole` is "viewer", so `requireActive` defaults to FALSE.
 *   So VIEWERS CAN SEE INACTIVE DASHBOARDS. Correct.)
 */
export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  // 1. Parse and validate the UUID path parameter
  const dashboardId = parseUuid((await params).dashboard_id);

  // 2. Authorize: Requires at least "viewer" role.
  // Default behavior: `requireActive` is false for "viewer", so inactive dashboards are visible.
  const { dashboard, role } = await requireDashboardRole(request, dashboardId, "viewer");

  // 3. Fetch member count (expensive query, but acceptable for a single detail view)
  const memberCount = await countMembers(dashboardId);

  // 4. Return serialized dashboard with enriched data
  return ok(serializeDashboard(dashboard, role, memberCount));
});

/**
 * PATCH /api/dashboards/:id
 *
 * Updates dashboard name or active status.
 *
 * Authorization: Owner role only.
 * Crucial: `requireActive: false` is passed explicitly.
 * Why? If we didn't, an owner trying to UPDATE an inactive dashboard would hit
 * a 409 DASHBOARD_INACTIVE error, making it impossible to reactivate it.
 * By bypassing the active check here, owners can set `is_active: true`.
 *
 * Errors:
 * - 400 MALFORMED_REQUEST (invalid UUID)
 * - 403 FORBIDDEN (user is not owner)
 * - 409 DASHBOARD_INACTIVE (blocked by requireDashboardRole if we didn't pass false)
 * - 404 NOT_FOUND (if dashboard was deleted between check and update)
 */
export const PATCH = withErrors(async (request: NextRequest, { params }: Ctx) => {
  // 1. Parse UUID
  const dashboardId = parseUuid((await params).dashboard_id);

  // 2. Authorize: Requires "owner".
  // CRITICAL: Pass `requireActive: false` to allow modifying inactive dashboards.
  const { role } = await requireDashboardRole(request, dashboardId, "owner", {
    requireActive: false, // Allows reactivating or deleting inactive dashboards
  });

  // 3. Parse & validate body
  const changes = await parseJson(request, updateDashboardSchema);

  // 4. Execute update (handles snake_case -> camelCase mapping internally)
  const updated = await updateDashboard(dashboardId, changes);

  // 5. Safety check: If update returned null, the dashboard was likely deleted
  // or doesn't exist (race condition).
  if (!updated) throw new ApiError("NOT_FOUND");

  // 6. Return updated state with member count
  return ok(serializeDashboard(updated, role, await countMembers(dashboardId)));
});

/**
 * DELETE /api/dashboards/:id
 *
 * Soft-deletes a dashboard.
 *
 * Authorization: Owner role only.
 * Crucial: `requireActive: false` allows deleting inactive dashboards.
 * Without this, an owner couldn't delete a dashboard that was previously deactivated.
 *
 * Response: 204 No Content (standard for successful deletions).
 */
export const DELETE = withErrors(async (request: NextRequest, { params }: Ctx) => {
  // 1. Parse UUID
  const dashboardId = parseUuid((await params).dashboard_id);

  // 2. Authorize: Requires "owner".
  // CRITICAL: Pass `requireActive: false` to allow deleting inactive dashboards.
  await requireDashboardRole(request, dashboardId, "owner", {
    requireActive: false,
  });

  // 3. Perform soft delete (sets deletedAt timestamp)
  await softDeleteDashboard(dashboardId);

  // 4. Return 204 No Content
  return noContent();
});
