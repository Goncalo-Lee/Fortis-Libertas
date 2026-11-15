import type { NextRequest } from "next/server";
import { db } from "@/db";
import { createNotification, listNotifications } from "@/db/queries/notifications";
import type { NotificationType } from "@/db/queries/notifications/type";
import { requireSession } from "@/lib/api/auth";
import { parseJson } from "@/lib/api/body";
import { withErrors } from "@/lib/api/errors";
import { parsePagination } from "@/lib/api/pagination";
import { created, paginated } from "@/lib/api/responses";
import { createNotificationSchema, listNotificationsQuery } from "@/lib/api/schemas/notification";
import { serializeNotification } from "@/lib/api/serializers/notification";

export const runtime = "nodejs";

/**
 * GET /api/v1/me/notifications?unread=true&type=...&sort=-created_at&page=1&per_page=25
 *
 * Lists the caller's own notifications, newest first by default (endpoints.md, section 4.3).
 *
 * Errors:
 * - 401 / 403 from requireSession
 * - 422 for an invalid `unread`, `sort`, `page` or `per_page`
 */
export const GET = withErrors(async (request: NextRequest) => {
  const { user } = await requireSession(request);

  const { searchParams } = request.nextUrl;
  const { page, perPage, offset } = parsePagination(searchParams);
  const filters = listNotificationsQuery.parse(Object.fromEntries(searchParams));

  const { rows, total } = await listNotifications(user.id, { ...filters, limit: perPage, offset });
  return paginated(rows.map(serializeNotification), { page, perPage, total });
});

/**
 * POST /api/v1/me/notifications
 *
 * Creates a notification for the caller.
 *
 * Body: { title: string, message: string, type?: string }
 */
export const POST = withErrors(async (request: NextRequest) => {
  const { user } = await requireSession(request);
  const input = await parseJson(request, createNotificationSchema);

  await createNotification(db, user.id, input.type as NotificationType, {
    title: input.title,
    message: input.message,
  });

  return created();
});


