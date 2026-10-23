import type { NextRequest } from "next/server";
import { getMe } from "@/db/queries/me";
import { requireSession } from "@/lib/api/auth";
import { ApiError, withErrors } from "@/lib/api/errors";
import { ok } from "@/lib/api/responses";
import { serializeUser } from "@/lib/api/serializers/user";

// Force Node.js runtime instead of Edge Runtime.
// Required because Drizzle/MySQL drivers depend on Node APIs (net, tls)
// that aren't available in the Edge Runtime.
export const runtime = "nodejs";

/**
 * GET /api/me
 *
 * Returns the authenticated user's full profile.
 *
 * Pipeline:
 * 1. requireSession -> validates auth, throws 401/403 if invalid
 * 2. getMe -> fetches user + profile rows (creates profile if missing)
 * 3. serializeUser -> transforms DB rows into API-shaped response
 * 4. ok -> wraps in { data } envelope with 200 status
 *
 * Error Handling:
 * - 401 UNAUTHENTICATED: no valid session
 * - 403 ACCOUNT_SUSPENDED: user is suspended
 * - 404 NOT_FOUND: session valid but user row missing (edge case)
 * - 500 INTERNAL_ERROR: unexpected failures (caught by withErrors)
 *
 * @param request - NextRequest containing session cookies/headers
 * @returns 200 with { data: SerializedUser }
 */
export const GET = withErrors(async (request: NextRequest) => {
  // Step 1: Authenticate. Throws ApiError if session invalid/deleted/suspended.
  // Destructure only 'user' since we don't need session metadata here.
  const { user: sessionUser } = await requireSession(request);

  // Step 2: Fetch user + profile from DB.
  // getMe handles the "create profile if missing" invariant internally.
  const me = await getMe(sessionUser.id);

  // Step 3: Guard against orphaned sessions.
  // If the session is valid but the user row was hard-deleted from the DB,
  // getMe returns null. We surface this as 404 rather than crashing.
  if (!me) throw new ApiError("NOT_FOUND");

  // Step 4: Serialize and respond.
  // serializeUser maps DB fields to API contract (snake_case, ISO dates, nested profile).
  return ok(serializeUser(me.user, me.profile));
});
