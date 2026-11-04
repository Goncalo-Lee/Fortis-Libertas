import type { NextRequest } from "next/server";
import { markAllNotificationsRead } from "@/db/queries/notifications";
import { requireSession } from "@/lib/api/auth";
import { withErrors } from "@/lib/api/errors";
import { ok } from "@/lib/api/responses";

export const runtime = "nodejs";

/**
 * POST /api/v1/me/notifications/read-all
 *
 * Marks every unread notification of the caller as read ("mark all as read" button).
 * Response: `{ "data": { "updated": 3 } }`. Calling it again returns `updated: 0`.
 */
export const POST = withErrors(async (request: NextRequest) => {
  const { user } = await requireSession(request);
  return ok({ updated: await markAllNotificationsRead(user.id) });
});
