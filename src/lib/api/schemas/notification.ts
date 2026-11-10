import { z } from "zod";

/** Query parameters of GET /me/notifications (endpoints.md, section 4.3). Pagination is parsed apart. */
export const listNotificationsQuery = z.looseObject({
  // Query strings are text, so the boolean arrives as "true"/"false".
  unread: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  type: z.string().min(1).max(255).optional(),
  sort: z.enum(["created_at", "-created_at"]).default("-created_at"),
});

/** Body of PATCH /me/notifications/{notification_id} (section 4.4). `read` is the only field and is required. */
export const updateNotificationSchema = z.strictObject({
  read: z.boolean().optional(), // backward compatibility if needed
  is_read: z.boolean().optional(), // context uses is_read
});

/** Body of POST /me/notifications */
export const createNotificationSchema = z.strictObject({
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1024),
  type: z.string().default("manual"),
});
