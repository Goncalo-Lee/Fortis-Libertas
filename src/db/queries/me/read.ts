import { and, eq, getTableColumns, isNull, sql } from "drizzle-orm";
import { db } from "../..";
import { bankAccount, bankAccountUser, currency, language, profile, user } from "../../schema";
import { getDefaultProfileCatalogIds } from "../catalogs";

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
    // The API exposes currency and language as codes ("EUR", "pt-PT"), the table stores their ids.
    const [row] = await db
      .select({
        ...getTableColumns(profile),
        currency: currency.code,
        language: language.code,
        // Set only when the user still belongs to a non-deleted primary account.
        primaryMember: bankAccountUser.userId,
      })
      .from(profile)
      .innerJoin(currency, eq(currency.id, profile.currencyId))
      .innerJoin(language, eq(language.id, profile.languageId))
      .leftJoin(bankAccount, and(eq(bankAccount.id, profile.primaryBankAccountId), isNull(bankAccount.deletedAt)))
      .leftJoin(
        bankAccountUser,
        and(
          eq(bankAccountUser.bankId, bankAccount.id),
          eq(bankAccountUser.userId, profile.userId),
          isNull(bankAccountUser.deletedAt),
        ),
      )
      .where(eq(profile.userId, userId))
      .limit(1);

    // A primary account that was deleted, or that the user left, reads as "none".
    if (!row) return row;
    const { primaryMember, ...rest } = row;
    return { ...rest, primaryBankAccountId: primaryMember ? rest.primaryBankAccountId : null };
  };

  let row = await find();

  // onDuplicateKeyUpdate covers the race where two requests create the profile at the same time.
  if (!row) {
    const defaults = await getDefaultProfileCatalogIds();
    await db.insert(profile).values({ userId, ...defaults }).onDuplicateKeyUpdate({ set: { userId } });
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
