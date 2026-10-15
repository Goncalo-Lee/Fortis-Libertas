import { eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "..";
import { profile, user } from "../schema";

/**
 * Fetches the authenticated user and their associated profile.
 *
 * Implements an "upsert-like" pattern:
 * 1. Retrieves the user record.
 * 2. Attempts to fetch the profile.
 * 3. If no profile exists, creates a blank one (ensuring every user has a profile).
 * 4. Returns both rows for serialization.
 *
 * @param userId - The ID of the user to fetch (typically from session)
 * @returns Object containing { user, profile } rows, or null if user not found
 * @throws Error if profile creation fails unexpectedly (indicates DB constraint issue)
 */
export async function getMe(userId: string) {
  // 1. Fetch the user row
  // Using .limit(1) and destructuring [userRow] is a common Drizzle pattern to get a single object
  // instead of an array, though .get() would be more explicit.
  const [userRow] = await db.select({
    ...getTableColumns(user),
    // Raw DATETIME value, bypassing the boolean mapping of `emailVerified`
    emailVerifiedRaw: sql<Date | string | null>`${user.emailVerified}`.as("email_verified_raw"),
  })
  .from(user).where(eq(user.id, userId)).limit(1);

  // If user doesn't exist, return null immediately.
  // This allows the caller to handle "not found" vs "internal error" distinctions.
  if (!userRow) return null;

  // Helper function to fetch the profile row.
  // Encapsulated to avoid code duplication in the retry logic below.
  const findProfile = async () => {
    const [row] = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);
    return row;
  };

  // Attempt to fetch existing profile
  let profileRow = await findProfile();

  // 2. Upsert Logic: If profile is missing, create one.
  // This ensures the invariant: "Every user must have a profile."
  if (!profileRow) {
    // Insert a new profile with just the userId.
    // .onDuplicateKeyUpdate({ set: { userId } }) acts as an UPSERT:
    // - If insert succeeds: great.
    // - If duplicate key error occurs (race condition): update the row (no-op here).
    // Note: This syntax assumes MySQL (ON DUPLICATE KEY UPDATE).
    await db.insert(profile).values({ userId }).onDuplicateKeyUpdate({ set: { userId } });

    // Re-fetch the profile to get the full row (including auto-generated IDs/timestamps)
    profileRow = await findProfile();
  }

  // 3. Safety Check: If profile still missing after insertion attempt, throw.
  // This catches race conditions where another process deleted the profile
  // or database constraint violations that weren't caught by the UPSERT.
  if (!profileRow) throw new Error("Profile could not be created");

  // Return the raw rows for the caller to serialize.
  // Matches the expected input types for serializeUser() and serializeProfile().
  return { user: userRow, profile: profileRow };
}
