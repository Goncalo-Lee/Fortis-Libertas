import { z } from "zod";

const uuid = z.guid().transform((v) => v.toLowerCase());
const dateTime = z.iso.datetime({ offset: true }).transform((v) => new Date(v));

/**
 * Single-value query parameters of the activity log lists (endpoints.md, section 19.3).
 * `action` is multi-value and is read apart with `getMulti`. `user_id` is ignored by GET /me/activity-logs.
 */
export const listActivityLogsQuery = z
  .looseObject({
    entity_type: z.string().min(1).max(50).optional(),
    user_id: uuid.optional(),
    created_from: dateTime.optional(),
    created_to: dateTime.optional(),
    sort: z.enum(["created_at", "-created_at"]).default("-created_at"),
  })
  .refine((v) => !v.created_from || !v.created_to || v.created_from <= v.created_to, {
    path: ["created_to"],
    message: "Must be on or after created_from.",
  });

/** `?action=` (repeated or comma separated). Free text: new actions can appear without changing this schema. */
export const activityLogMultiQuery = z.object({
  action: z.array(z.string().min(1).max(50)),
});
