import type { NextRequest } from "next/server";
import { listSessions, revokeOtherSessions } from "@/db/queries/me/sessions";
import { requireSession } from "@/lib/api/auth";
import { withErrors } from "@/lib/api/errors";
import { noContent, ok } from "@/lib/api/responses";
import { serializeSession } from "@/lib/api/serializers/session";

export const runtime = "nodejs";

/**
 * GET /api/v1/me/sessions
 *
 * Lists the caller's active sessions (one per signed-in device), newest first.
 * `is_current` marks the session making this request, so the client can label it "this device".
 *
 * Errors: 401 / 403 from requireSession.
 */
export const GET = withErrors(async (request: NextRequest) => {
  const { user, session } = await requireSession(request);
  const rows = await listSessions(user.id, session.id);
  return ok(rows.map(serializeSession));
});

/**
 * DELETE /api/v1/me/sessions
 *
 * Revokes every session of the caller **except** the current one ("sign out of all other devices").
 * To end the current session, the client uses POST /api/auth/sign-out instead.
 *
 * Errors: 401 / 403 from requireSession.
 */
export const DELETE = withErrors(async (request: NextRequest) => {
  const { user, session } = await requireSession(request);
  await revokeOtherSessions(user.id, session.id);
  return noContent();
});
