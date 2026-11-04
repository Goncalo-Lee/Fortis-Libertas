import type { NextRequest } from "next/server";
import { deleteNotification, getNotification, setNotificationRead } from "@/db/queries/notifications";
import { requireSession } from "@/lib/api/auth";
import { parseJson } from "@/lib/api/body";
import { ApiError, withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { noContent, ok } from "@/lib/api/responses";
import { updateNotificationSchema } from "@/lib/api/schemas/notification";
import { serializeNotification } from "@/lib/api/serializers/notification";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ notification_id: string }> };

/**
 * PATCH /api/v1/me/notifications/{notification_id}
 *
 * Body `{ "read": true }` marks as read (keeping the first read date); `{ "read": false }` marks as unread.
 *
 * Errors:
 * - 400 for an id that is not a UUID, or a body that is not JSON
 * - 401 / 403 from requireSession
 * - 404 if the notification does not exist or belongs to another user
 * - 422 if `read` is missing, not a boolean, or another key is sent
 *
 * @returns 200 with the updated notification
 */
export const PATCH = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const notificationId = parseUuid((await params).notification_id);
  const { user } = await requireSession(request);
  const { read } = await parseJson(request, updateNotificationSchema);

  if (!(await setNotificationRead(user.id, notificationId, read))) throw new ApiError("NOT_FOUND");

  const row = await getNotification(user.id, notificationId);
  if (!row) throw new ApiError("NOT_FOUND"); // Deleted between the two calls (edge case).
  return ok(serializeNotification(row));
});

/**
 * DELETE /api/v1/me/notifications/{notification_id}
 *
 * Physically deletes one of the caller's notifications (no soft delete: it has no value once dismissed).
 *
 * Errors: 400 bad id, 401 / 403, 404 not found or another user's.
 */
export const DELETE = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const notificationId = parseUuid((await params).notification_id);
  const { user } = await requireSession(request);

  if (!(await deleteNotification(user.id, notificationId))) throw new ApiError("NOT_FOUND");
  return noContent();
});
