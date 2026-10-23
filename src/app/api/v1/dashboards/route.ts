import type { NextRequest } from "next/server";
import { createDashboard, findMembership, listDashboards } from "@/db/queries/dashboards";
import { requireSession } from "@/lib/api/auth";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parsePagination } from "@/lib/api/pagination";
import { created, paginated } from "@/lib/api/responses";
import { createDashboardSchema, listDashboardQuery } from "@/lib/api/schemas/dashboard";
import { serializeDashboard } from "@/lib/api/serializers/dashboard";

// Force Node.js runtime for MySQL driver compatibility.
export const runtime = "nodejs";

/**
 * GET /api/dashboards
 *
 * Lists dashboards accessible by the authenticated user with filtering and pagination.
 *
 * Pipeline:
 * 1. requireSession -> authenticate user
 * 2. parsePagination -> extract & validate page/per_page (defaults applied)
 * 3. listDashboardQuery.parse -> validate & coerce query params (is_active, role, q, sort)
 * 4. listDashboards -> execute filtered/ordered query with offset/limit
 * 5. serializeDashboard -> map rows to API shape (including user's role)
 * 6. paginated -> wrap in { data, meta } envelope
 *
 * Note: No explicit role check here because `listDashboards` already filters
 * by `eq(userDashboard.userId, userId)` and excludes deleted rows.
 * The returned `role` field allows clients to adapt UI per-dashboard.
 */
export const GET = withErrors(async (request: NextRequest) => {
  // 1. Authenticate
  const { user } = await requireSession(request);

  // 2. Extract query params
  const { searchParams } = request.nextUrl;

  // 3. Parse pagination (page, per_page, offset)
  const { page, perPage, offset } = parsePagination(searchParams);

  // 4. Validate & coerce filters (is_active: "true" -> true, etc.)
  // Object.fromEntries converts URLSearchParams to a plain object for Zod.
  const filters = listDashboardQuery.parse(Object.fromEntries(searchParams));

  // 5. Execute query with merged pagination + filters
  const { rows, total } = await listDashboards(user.id, {
    ...filters,
    limit: perPage,
    offset
  });

  // 6. Serialize rows (mapping DB row + role -> API object)
  // Note: memberCount is omitted here to avoid N+1 queries in list views.
  const serializedRows = rows.map((r) => serializeDashboard(r.dashboard, r.role));

  // 7. Return paginated response
  return paginated(serializedRows, { page, perPage, total });
});

/**
 * POST /api/dashboards
 *
 * Creates a new dashboard for the authenticated user.
 *
 * Pipeline:
 * 1. requireSession -> authenticate
 * 2. parseJson + createDashboardSchema -> validate body (name, optional is_active)
 * 3. createDashboard -> transactional insert (dashboard + membership + seed types)
 * 4. findMembership -> verify ownership was created (safety check)
 * 5. serializeDashboard + created -> return 201 with Location header
 *
 * Errors:
 * - 400 MALFORMED_REQUEST (bad JSON)
 * - 422 VALIDATION_ERROR (invalid name, etc.)
 * - 500 INTERNAL_ERROR (if membership creation fails unexpectedly)
 */
export const POST = withErrors(async (request: NextRequest) => {
  // 1. Authenticate
  const { user } = await requireSession(request);

  // 2. Parse & validate body
  const input = await parseJson(request, createDashboardSchema);

  // 3. Create dashboard (transactional: inserts dashboard, owner membership, default types)
  const id = await createDashboard(user.id, input);

  // 4. Safety check: verify the membership was actually created.
  // This should never fail if createDashboard succeeded, but guards against
  // rare race conditions or DB inconsistencies.
  const membership = await findMembership(id, user.id);

  if (!membership) throw new ApiError("INTERNAL_ERROR");

  // 5. Return 201 Created with Location header and full resource.
  // memberCount is hardcoded to 1 (just the owner) since we know the initial state.
  return created(
    serializeDashboard(membership.dashboard, membership.role, 1),
    `/api/v1/dashboards/${id}`,
  );
});
