import type { NextRequest } from "next/server";
import { listAccounts } from "@/db/queries/me/accounts";
import { requireSession } from "@/lib/api/auth";
import { withErrors } from "@/lib/api/errors";
import { ok } from "@/lib/api/responses";
import { serializeAccount } from "@/lib/api/serializers/account";

export const runtime = "nodejs";

/**
 * GET /api/v1/me/accounts
 *
 * Lists the sign-in methods linked to the caller (e.g. password and Google), so the settings page can show
 * "Google: connected" and whether a password exists. Linking and unlinking are done through Better Auth.
 *
 * Errors: 401 / 403 from requireSession.
 */
export const GET = withErrors(async (request: NextRequest) => {
  const { user } = await requireSession(request);
  const rows = await listAccounts(user.id);
  return ok(rows.map(serializeAccount));
});
