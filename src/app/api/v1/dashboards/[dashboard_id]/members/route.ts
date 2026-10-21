import type { NextRequest } from "next/server";
import {
  addMember,
  getMember,
  listMembers,
} from "@/db/queries/members";
import { requireDashboardRole } from "@/lib/api/access";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { parsePagination } from "@/lib/api/pagination";
import { created, paginated } from "@/lib/api/responses";
import { addMemberSchema } from "@/lib/api/schemas/member";
import { serializeMember } from "@/lib/api/serializers/member";
import { findMembership, findUser } from "@/db/queries/dashboards";

// Force Node.js runtime for MySQL driver compatibility.
export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string }> };

/**
 * GET /api/dashboards/:id/members
 *
 * Lists members of a dashboard with pagination.
 *
 * Authorization: "viewer" — anyone who can see the dashboard can see its roster.
 *
 * Pipeline: parseUuid -> requireDashboardRole(viewer) -> parsePagination
 *           -> listMembers -> serializeMember -> paginated
 *
 * Note: No memberCount enrichment here — the response IS the member list.
 * The `paginated` helper supplies total/page/per_page metadata.
 */
export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  // 1. Validate the path UUID
  const dashboardId = parseUuid((await params).dashboard_id);

  // 2. Authorize — viewer is sufficient for reading the roster.
  //    (Default requireActive=false for viewers, so inactive dashboards remain inspectable.)
  await requireDashboardRole(request, dashboardId, "viewer");

  // 3. Pagination params (page/per_page with defaults, offset computed)
  const { page, perPage, offset } = parsePagination(request.nextUrl.searchParams);

  // 4. Query the joined member+user rows
  const { rows, total } = await listMembers(dashboardId, perPage, offset);

  // 5. Serialize each row and wrap in the paginated envelope
  return paginated(rows.map(serializeMember), { page, perPage, total });
});

/**
 * POST /api/dashboards/:id/members
 *
 * Invites/adds a member to a dashboard.
 *
 * Authorization: "owner" only — membership changes are privileged.
 *
 * Identifier resolution: the schema guarantees exactly one of
 * user_id / email / user_name. We resolve it to a real user ID, then add.
 *
 * Errors:
 * - 400 MALFORMED_REQUEST (bad UUID / bad JSON)
 * - 403 FORBIDDEN (not an owner)
 * - 409 ALREADY_MEMBER (from addMember)
 * - 409 DASHBOARD_INACTIVE (if dashboard inactive — owner default requires active)
 * - 422 VALIDATION_ERROR (schema failure, or unresolvable identifier)
 * - 500 INTERNAL_ERROR (post-insert read failure)
 */
export const POST = withErrors(async (request: NextRequest, { params }: Ctx) => {
  // 1. Validate path UUID
  const dashboardId = parseUuid((await params).dashboard_id);

  // 2. Authorize — owner required.
  //    NOTE: unlike PATCH/DELETE on the dashboard itself, this does NOT pass
  //    requireActive: false. So inviting to an inactive dashboard is blocked
  //    with 409 DASHBOARD_INACTIVE. (See consideration below.)
  await requireDashboardRole(request, dashboardId, "owner");

  // 3. Validate body — exactly one identifier + role
  const input = await parseJson(request, addMemberSchema);

  // 4. Resolve the identifier to a concrete user ID.
  //    user_id is lowercased defensively (UUIDs are canonically lowercase).
  const targetUser = await findUser({
    userId: input.user_id?.toLowerCase(),
    email: input.email,
    userName: input.user_name,
  });

  // 5. If no active user matches, return a FIELD-LEVEL 422.
  //    The pointer is chosen to match whichever identifier the client supplied,
  //    so the error lands on the right form field in the UI.
  if (!targetUser) {
    const pointer = input.user_id ? "/user_id" : input.email ? "/email" : "/user_name";
    throw new ApiError("VALIDATION_ERROR", "User not found.", [
      { pointer, message: "No active user found." },
    ]);
  }

  const existing = await findMembership(dashboardId, targetUser.id);

  if (existing) {
    throw new ApiError("ALREADY_MEMBER", "This user is alreday member")
  };

  // 6. Add (or reactivate) the membership — transactional, handles ALREADY_MEMBER
  await addMember(dashboardId, targetUser.id, input.role);

  // 7. Read back the created membership (with joined user data) for the response.
  const member = await getMember(dashboardId, targetUser.id);
  if (!member) throw new ApiError("INTERNAL_ERROR");

  // 8. 201 Created with Location header pointing at the new member resource.
  return created(
    serializeMember(member),
    `/api/v1/dashboards/${dashboardId}/members/${targetUser}`,
  );
});
