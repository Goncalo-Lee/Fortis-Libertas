import { eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "../..";
import { profile, user } from "../../schema";

/* ======
  READ
======= */

/**
 * Retrieves a user's profile, creating an empty one if none exists.
 *
 * Acts as a safety net for the "create profile on signup" flow. Uses a
 * check-then-insert pattern with a re-fetch to pick up generated fields.
 *
 * @param userId - The unique identifier of the user
 * @returns The full profile row
 * @throws {Error} If the profile cannot be created (indicates a DB constraint or race condition)
 *
 * @example
 * const profile = await getOrCreateProfile("user_123");
 * console.log(profile.currency);
 */
export async function getOrCreateProfile(userId: string) {
  const find = async () => {
    const [row] = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);
    return row;
  };

  let row = await find();

  // onDuplicateKeyUpdate covers the race where two requests create the profile at the same time.
  if (!row) {
    await db.insert(profile).values({ userId }).onDuplicateKeyUpdate({ set: { userId } });
    row = await find();
  }

  if (!row) throw new Error("Profile could not be created");

  return row;
}

/**
 * Retrieves the user and their profile for the `/me` endpoint.
 *
 * Selects every user column and casts `emailVerified` to `email_verified_raw`,
 * so the returned key matches what the serializer expects.
 *
 * @param userId - The unique identifier of the user
 * @returns An object with the `user` and `profile` rows, or `null` if the user does not exist
 *
 * @example
 * const me = await getMe("user_123");
 * if (me) {
 *   console.log(me.user.email, me.profile.currency);
 * }
 */
export async function getMe(userId: string) {
  const [userRow] = await db
    .select({
      ...getTableColumns(user),
      emailVerified: sql<Date | string | null>`${user.emailVerified}`.as("email_verified_raw"),
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!userRow) return null;

  return { user: userRow, profile: await getOrCreateProfile(userId) };
}
