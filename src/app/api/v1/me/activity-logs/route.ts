import type { NextRequest } from "next/server";
import { listActivityLogs } from "@/db/queries/activity-logs";
import { readActivityLogQuery } from "@/lib/api/activity-log-query";
import { requireSession } from "@/lib/api/auth";
import { withErrors } from "@/lib/api/errors";
import { paginated } from "@/lib/api/responses";
import { serializeActivityLog } from "@/lib/api/serializers/activity-log";

export const runtime = "nodejs";

/**
 * GET /api/v1/me/activity-logs
 *
 * The caller's own account events: sign-up, sign-in, sign-out, password and 2FA changes, profile and identity updates,
 * and revoked sessions. This is the only log that returns `ip_address` and `user_agent`, so the user can spot a
 * sign-in from a device they do not recognise (endpoints.md, section 19.4).
 *
 * `user_id` is not accepted here: every entry already belongs to the caller.
 */
export const GET = withErrors(async (request: NextRequest) => {
  const { user } = await requireSession(request);

  const { page, perPage, filters } = readActivityLogQuery(request.nextUrl.searchParams, { allowUserFilter: false });
  const { rows, total } = await listActivityLogs({ scope: "account", userId: user.id }, filters);

  return paginated(rows.map((row) => serializeActivityLog(row, { withDevice: true })), { page, perPage, total });
});
