import { z } from "zod";

// Reusable role enum, shared across member-related schemas.
const role = z.enum(["owner", "editor", "viewer"]);

/**
 * Schema for POST /dashboards/:id/members (invite/add a member).
 *
 * A member is identified by EXACTLY ONE of three identifiers:
 * user_id, email, or user_name.
 *
 * - .strictObject(): rejects unknown keys (mass-assignment protection).
 * - .refine(): enforces the "exactly one" invariant by counting how many
 *   of the three identifiers were provided. This is the corrected version —
 *   the previous chained-XOR predicate (a !== b !== c) evaluated
 *   left-to-right and wrongly accepted several invalid combinations.
 *
 * The identifier fields are all `.optional()` individually, then the refine
 * narrows the whole object down to "one and only one present."
 */
export const addMemberSchema = z
  .strictObject({
    // Path 1: invite by known user ID (UUID)
    user_id: z.guid().optional(),

    // Path 2: invite by email (validated format)
    email: z.email().optional(),

    // Path 3: invite by username — trimmed, bounded 3–254 chars
    user_name: z.string().trim().min(3).max(254).optional(),

    // Role is always required, regardless of which identifier is used
    role,
  })
  .refine(
    // Count provided identifiers; must equal exactly 1.
    // `filter(x => x !== undefined)` correctly treats empty strings as
    // "provided" — but empty strings are already rejected by the field
    // validators (min(3), email format, guid format) before this runs.
    (v) => [v.user_id, v.email, v.user_name].filter((x) => x !== undefined).length === 1,
    {
      message: "Provide exactly one of user_id, email or user_name.",
      path: ["user_id"], // Attaches the error to user_id for the 422 response
    },
  );

/**
 * Schema for PATCH /dashboards/:id/members/:userId (change role).
 *
 * Only `role` is mutable. The member is identified by the path param,
 * so no identifier fields are accepted here.
 */
export const updateMemberSchema = z.strictObject({ role });
