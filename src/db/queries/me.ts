import { eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "..";
import { profile, user } from "../schema";

// Type definition for the input payload.
// Uses optional properties (?) to represent the partial nature of the update.
// Matches the keys of the Zod schema (snake_case) but will be mapped to camelCase for DB.
type ProfileChanges = {
  birth_date?: string | null;
  phone?: string | null;
  currency?: string;
  language?: string;
}

/**
 * Fetches a user's profile, creating one if it doesn't exist.
 *
 * Acts as a safety net for the "create profile on signup" flow.
 * Implements a "check-then-insert" pattern with a retry fetch.
 *
 * @param userId - The ID of the user
 * @returns The full profile row
 * @throws Error if creation fails (indicates DB constraint/race condition)
 */
export async function getOrCreateProfile(userId: string) {
  // Helper to fetch the row
  const find = async () => {
    const [row] = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);
    return row;
  };

  let row = await find();

  // If missing, attempt to create.
  // onDuplicateKeyUpdate handles race conditions where two requests create simultaneously.
  if (!row) {
    await db.insert(profile).values({ userId }).onDuplicateKeyUpdate({ set: { userId } });
    row = await find(); // Re-fetch to get generated fields (id, timestamps)
  }

  // Safety guard: if still missing, something went wrong with the DB transaction.
  if (!row) throw new Error("Profile could not be created");

  return row;
}

/**
 * Updates a user's profile with partial changes.
 *
 * Key Logic:
 * 1. Ensures profile exists.
 * 2. Builds a dynamic `set` object only for provided fields.
 * 3. **Business Rule**: Changing the phone number resets verification status.
 * 4. Skips the UPDATE query entirely if no fields changed (optimization).
 * 5. Forces `updatedAt` to now.
 *
 * @param userId - The ID of the user
 * @param changes - Partial payload from validated request
 * @returns The updated profile row
 */
export async function updateProfile(userId: string, changes: ProfileChanges) {
  // Ensure we have a profile to update
  const current = await getOrCreateProfile(userId);

  // Build the SET clause dynamically
  const set: Partial<typeof profile.$inferInsert> = {};

  // Map snake_case input to camelCase DB columns
  // Convert ISO string to Date object for birth_date
  if (changes.birth_date !== undefined) {
    set.birthDate = changes.birth_date ? new Date(changes.birth_date) : null;
  }

  if (changes.currency !== undefined) set.currency = changes.currency;
  if (changes.language !== undefined) set.language = changes.language;

  // Special Logic: Phone Verification Reset
  // If the user provides a NEW phone number, mark it as unverified.
  // Note: We compare against 'current.phone' to detect actual changes.
  // If they sent the SAME phone number, we don't reset verification (idempotent).
  if (changes.phone !== undefined && changes.phone !== current.phone) {
    set.phone = changes.phone;
    set.phoneVerifiedAt = null; // Reset verification timestamp
  }

  // Optimization: Only execute SQL if there are actual changes to apply.
  // This prevents unnecessary DB writes and `updatedAt` bumps for no-op requests.
  if (Object.keys(set).length > 0) {
    await db
      .update(profile)
      .set({ ...set, updatedAt: new Date() }) // Force update timestamp
      .where(eq(profile.userId, userId));
  }

  // Return the fresh state (includes any DB-generated defaults or timestamps)
  return getOrCreateProfile(userId);
}

/**
 * Fetches the user and their profile for the `/me` endpoint.
 *
 * Improvements over previous version:
 * 1. Uses `getTableColumns(user)` to explicitly select all user columns.
 * 2. Uses `sql` template literal to cast/alias `emailVerified` to `email_verified_raw`.
 *    This ensures the returned object has the correct key name for the serializer.
 * 3. Returns a single object with both rows, reducing caller boilerplate.
 *
 * @param userId - The ID of the user
 * @returns Object containing { user, profile } rows, or null if user missing
 */
export async function getMe(userId: string) {
  // Select all user columns + manually alias the emailVerified column.
  // The `sql` tag allows raw SQL injection for specific casting/aliasing needs
  // that the ORM's standard `.as()` might not handle cleanly in complex selects.
  const [userRow] = await db
    .select({
      ...getTableColumns(user), // Spreads all user columns
      // Cast to Date|string|null and rename to match serializer expectation
      emailVerified: sql<Date | string | null>`${user.emailVerified}`.as("email_verified_raw"),
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!userRow) return null;

  // Fetch profile (with safety net creation)
  return { user: userRow, profile: await getOrCreateProfile(userId) };
}
