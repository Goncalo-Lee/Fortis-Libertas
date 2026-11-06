import type { NextRequest } from "next/server";
import { revokeSessionById } from "@/db/queries/me/sessions";
import { requireSession } from "@/lib/api/auth";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { noContent } from "@/lib/api/responses";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ session_id: string }> };

/**
 * DELETE /api/v1/me/sessions/{session_id}
 *
 * Revokes one of the caller's sessions (e.g. "sign out the old phone").
 *
 * Pipeline:
 * 1. parseUuid          -> 400 if the id is not a UUID
 * 2. requireSession     -> 401 / 403
 * 3. current session?   -> 409 CURRENT_SESSION: the client must use POST /api/auth/sign-out, which also clears the cookie
 * 4. revokeSessionById  -> 404 if the session does not exist or belongs to another user (no way to probe other users' ids)
 */
export const DELETE = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const sessionId = parseUuid((await params).session_id);
  const { user, session } = await requireSession(request);

  if (sessionId === session.id.toLowerCase()) {
    throw new ApiError("CURRENT_SESSION", "Use POST /api/auth/sign-out to end the current session.");
  }

  if (!(await revokeSessionById(user.id, sessionId))) throw new ApiError("NOT_FOUND");
  return noContent();
});
