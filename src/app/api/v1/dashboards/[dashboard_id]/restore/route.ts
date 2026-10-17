import type { NextRequest } from "next/server";
import { countMembers, restoreDashboard } from "@/db/queries/dashboards";
import { requireDashboardRole } from "@/lib/api/access";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { ok } from "@/lib/api/responses";
import { serializeDashboard } from "@/lib/api/serializers/dashboard";
import { DASHBOARD_RESTORE_WINDOW_DAYS, DAY_MS } from "@/lib/constants";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string }> };

/**
 * POST /api/dashboards/:id/restore
 *
 * Restores a soft-deleted dashboard if it is within the retention window.
 *
 * Authorization: Owner role only.
 * Crucially passes `requireActive: false` (dashboard is deleted/inactive)
 * and `includeDeleted: true` (custom flag to allow querying deleted rows).
 */
export const POST = withErrors(async (request: NextRequest, { params }: Ctx) => {
  // 1. Parse UUID
  const dashboardId = parseUuid((await params).dashboard_id);

  // 2. Authorize & Fetch Deleted Dashboard
  // Requires `includeDeleted: true` to fetch a row that `requireDashboardRole`
  // would normally filter out. This implies `requireDashboardRole` has been
  // updated to accept this option.
  const { dashboard, role } = await requireDashboardRole(request, dashboardId, "owner", {
    requireActive: false,
    includeDeleted: true, // Custom extension needed in the middleware
  });

  // 3. Sanity Check: Ensure the dashboard is actually deleted.
  // If it's already active, we don't need to restore it.
  if (!dashboard.deletedAt) throw new ApiError("NOT_DELETED");

  // 4. Time Window Check
  // Calculates time since deletion in milliseconds.
  const timeSinceDeletion = Date.now() - new Date(dashboard.deletedAt).getTime();

  // This means the restore window is effectively 30 days.
  if (timeSinceDeletion > DASHBOARD_RESTORE_WINDOW_DAYS * DAY_MS) throw new ApiError("RESTORE_WINDOW_EXPIRED");

  // 5. Execute Restore
  const restored = await restoreDashboard(dashboardId);
  if (!restored) throw new ApiError("NOT_FOUND");

  // 6. Return Restored Dashboard
  return ok(serializeDashboard(restored, role, await countMembers(dashboardId)));
});
