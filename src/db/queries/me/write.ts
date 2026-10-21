import { eq } from "drizzle-orm";
import { db } from "../..";
import { profile } from "../../schema";
import { getOrCreateProfile } from "./read";
import type { ProfileChanges } from "./type";

/* =======
  WRITE
======= */

/**
 * Updates a user's profile with partial changes.
 *
 * Changing the phone number resets its verification status. Sending the same
 * number again does not reset it, so the operation is idempotent. The SQL
 * UPDATE is skipped when nothing changed, which avoids unnecessary writes and
 * `updatedAt` bumps.
 *
 * @param userId - The unique identifier of the user
 * @param changes - Partial payload from the validated request
 * @returns The updated profile row
 *
 * @example
 * const updated = await updateProfile("user_123", {
 *   currency: "EUR",
 *   phone: "+351912345678",
 * });
 * console.log(updated.phoneVerifiedAt); // null, the phone must be verified again
 */
export async function updateProfile(userId: string, changes: ProfileChanges) {
  const current = await getOrCreateProfile(userId);

  const set: Partial<typeof profile.$inferInsert> = {};

  // Map snake_case input to camelCase columns. Convert the ISO string to a Date.
  if (changes.birth_date !== undefined) {
    set.birthDate = changes.birth_date ? new Date(changes.birth_date) : null;
  }

  if (changes.currency !== undefined) set.currency = changes.currency;
  if (changes.language !== undefined) set.language = changes.language;

  // A new phone number is unverified until confirmed again.
  if (changes.phone !== undefined && changes.phone !== current.phone) {
    set.phone = changes.phone;
    set.phoneVerifiedAt = null;
  }

  if (Object.keys(set).length > 0) {
    await db
      .update(profile)
      .set({ ...set, updatedAt: new Date() })
      .where(eq(profile.userId, userId));
  }

  return getOrCreateProfile(userId);
}
