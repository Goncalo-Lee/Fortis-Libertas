import type { NextRequest } from "next/server";
import { deleteAccount, getMe, updateUser } from "@/db/queries/me";
import { requireSession } from "@/lib/api/auth";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { noContent, ok } from "@/lib/api/responses";
import { updateMeSchema } from "@/lib/api/schemas/user";
import { serializeUser } from "@/lib/api/serializers/user";

// Force Node.js runtime instead of Edge Runtime.
// Required because Drizzle/MySQL drivers depend on Node APIs (net, tls)
// that aren't available in the Edge Runtime.
export const runtime = "nodejs";

/** Reads the caller with their profile and serializes it; 404 if the user row vanished (edge case). */
async function respondWithMe(userId: string) {
  const me = await getMe(userId);
  if (!me) throw new ApiError("NOT_FOUND");
  return ok(serializeUser(me.user, me.profile));
}

/**
 * GET /api/v1/me
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
 */
export const GET = withErrors(async (request: NextRequest) => {
  const { user } = await requireSession(request);
  return respondWithMe(user.id);
});

/**
 * PATCH /api/v1/me
 *
 * Updates `user_name`, `full_name` and/or `image` of the caller (endpoints.md, section 3.4).
 *
 * Pipeline: requireSession -> parseJson(updateMeSchema) -> updateUser -> respond with the fresh user
 *
 * Errors:
 * - 400 MALFORMED_REQUEST: body is not valid JSON
 * - 401 / 403: no valid session / suspended account
 * - 409 USER_NAME_TAKEN: another user has that user_name
 * - 422 VALIDATION_ERROR: unknown key, empty body, or a field out of its limits
 *
 * @returns 200 with the same shape as GET /me, so the client can replace its cached user
 */
export const PATCH = withErrors(async (request: NextRequest) => {
  const { user } = await requireSession(request);
  const changes = await parseJson(request, updateMeSchema);

  await updateUser(user.id, changes);
  return respondWithMe(user.id);
});

/**
 * DELETE /api/v1/me
 *
 * Soft-deletes the caller's account and signs them out of every device (endpoints.md, section 3.8).
 *
 * Errors:
 * - 401 / 403: no valid session / suspended account
 * - 409 LAST_OWNER: the user is the only owner of a dashboard or bank account that has other members
 *
 * @returns 204 No Content. The session used for this request no longer exists afterwards.
 */
export const DELETE = withErrors(async (request: NextRequest) => {
  const { user } = await requireSession(request);
  await deleteAccount(user.id);
  return noContent();
});
