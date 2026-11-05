import type { NextRequest } from "next/server";
import { countUnreadNotifications } from "@/db/queries/notifications";
import { requireSession } from "@/lib/api/auth";
import { withErrors } from "@/lib/api/errors";
import { ok } from "@/lib/api/responses";

export const runtime = "nodejs";

/**
 * GET /api/v1/me/notifications/unread-count
 *
 * Number of unread notifications, for the badge on the bell icon. A separate endpoint so the client can poll it
 * cheaply without loading the list. Response: `{ "data": { "unread": 3 } }`.
 */
export const GET = withErrors(async (request: NextRequest) => {
  const { user } = await requireSession(request);
  return ok({ unread: await countUnreadNotifications(user.id) });
});
