import type { NextRequest } from "next/server";
import { getMe } from "@/db/queries/me";
import { requireSession } from "@/lib/api/auth";
import { ApiError, withErrors } from "@/lib/api/errors";
import { ok } from "@/lib/api/responses";
import { serializeUser } from "@/lib/api/serializers/user";

export const runtime = "nodejs";

export const GET = withErrors(async (request: NextRequest) => {

  const { user: sessionUser } = await requireSession(request);

  const me = await getMe(sessionUser.id);

  if (!me) throw new ApiError("NOT_FOUND");

  return ok(serializeUser(me.user, me.profile));

});
