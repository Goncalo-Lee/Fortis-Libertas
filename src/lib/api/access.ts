import { findMembership, type Role } from "@/db/queries/dashboards";
import { requireSession } from "./auth";
import { ApiError } from "./errors";

// Numeric ranking enables simple comparison-based permission checks.
// Higher number = more privileges. Using a Record<Role, number> guarantees
// exhaustiveness: adding a new Role to the union forces an update here.
const RANK: Record<Role, number> = { viewer: 1, editor: 2, owner: 3 };

type Options = {
  /**
   * Reject the request with 409 DASHBOARD_INACTIVE if the dashboard is inactive.
   * Defaults to true for editor/owner routes and false for viewer routes.
   * The dashboard's own PATCH/DELETE must pass `false` so it can be reactivated or deleted.
   */
  requireActive?: boolean;
};

/**
 * Authorizes a request against a dashboard by verifying membership and role.
 *
 * Layered checks (each fails fast):
 * 1. Authentication        -> 401/403 via requireSession
 * 2. Membership existence  -> 404 (deliberately NOT 403, see below)
 * 3. Role sufficiency      -> 403 FORBIDDEN
 * 4. Dashboard active-ness -> 409 DASHBOARD_INACTIVE (conditional)
 *
 * @param request - Incoming request (for session resolution)
 * @param dashboardId - Target dashboard
 * @param minRole - Minimum role required ("viewer" | "editor" | "owner")
 * @param options.requireActive - Override the default active-check behavior
 * @returns { session, dashboard, role } for use in the handler
 */
export async function requireDashboardRole(
  request: Request,
  dashboardId: string,
  minRole: Role,
  options: Options = {},
) {
  // 1. Authenticate — throws 401 (no session/deleted) or 403 (suspended)
  const session = await requireSession(request);

  // 2. Resolve membership — joins userDashboard + dashboard, excluding soft-deleted rows
  const membership = await findMembership(dashboardId, session.user.id);

  // 3. Enumeration defense: return 404 instead of 403 for non-members.
  // If we returned 403, an attacker could probe UUIDs and learn which ones
  // correspond to real dashboards (403 = exists, 404 = doesn't). By collapsing
  // "not a member" and "doesn't exist" into the same 404, we leak nothing.
  if (!membership) throw new ApiError("NOT_FOUND");

  // 4. Rank comparison — viewer(1) < editor(2) < owner(3).
  // A viewer hitting an editor route fails here with 403.
  if (RANK[membership.role] < RANK[minRole]) throw new ApiError("FORBIDDEN");

  // 5. Determine whether inactive dashboards should be rejected.
  // Default: viewers can read inactive dashboards, editors/owners cannot mutate them.
  // Callers can override — notably the dashboard's own PATCH/DELETE passes `false`
  // so a deactivated dashboard can still be reactivated or removed.
  const requireActive = options.requireActive ?? minRole !== "viewer";

  if (requireActive && !membership.dashboard.isActive) {
    throw new ApiError("DASHBOARD_INACTIVE");
  }

  // Return everything the handler needs, avoiding a second lookup.
  return { session, dashboard: membership.dashboard, role: membership.role };
}
