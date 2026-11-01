import type { MemberRow } from "../../../db/queries/dashboard-members";
import { toIso } from "./common";

/**
 * Serializes a raw member row (from the dashboard-members join) into the API response shape.
 *
 * The `MemberRow` type is derived directly from the `getMember` query, meaning it already
 * contains the denormalized user fields (`userName`, `fullName`, `image`) joined from
 * the `user` table. This serializer simply renames them to snake_case and formats dates.
 *
 * @param row - Raw row containing { userId, role, userName, fullName, image, ... }
 * @returns API-shaped member object
 */
export function serializeMember(row: MemberRow) {
  return {
    // Rename PK to `user_id` for consistency with other API responses
    user_id: row.userId,

    // Denormalized user data (fetched via INNER JOIN in the query)
    user_name: row.userName,
    full_name: row.fullName,
    image: row.image,

    // Membership-specific data
    role: row.role,

    // Audit timestamps normalized to ISO 8601 UTC
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  };
}
