import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { bankAccount, bankAccountUser, profile, user } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import { getOrCreateProfile } from "./read";
import { requireCurrencyId, requireLanguageId } from "../catalogs";
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

  // The API receives codes; the table stores ids. Unknown codes answer 422.
  if (changes.currency !== undefined) set.currencyId = await requireCurrencyId(changes.currency);
  if (changes.language !== undefined) set.languageId = await requireLanguageId(changes.language);

  // The primary account must be one the user belongs to; `null` clears it.
  if (changes.primary_bank_account_id !== undefined) {
    if (changes.primary_bank_account_id !== null) {
      const [member] = await db
        .select({ userId: bankAccountUser.userId })
        .from(bankAccountUser)
        .innerJoin(bankAccount, eq(bankAccount.id, bankAccountUser.bankId))
        .where(
          and(
            eq(bankAccountUser.bankId, changes.primary_bank_account_id),
            eq(bankAccountUser.userId, userId),
            isNull(bankAccountUser.deletedAt),
            isNull(bankAccount.deletedAt),
          ),
        )
        .limit(1);

      if (!member) {
        throw new ApiError("VALIDATION_ERROR", "Bank account not found.", [
          { pointer: "/primary_bank_account_id", message: "You are not a member of this bank account." },
        ]);
      }
    }
    set.primaryBankAccountId = changes.primary_bank_account_id;
  }

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


/**
 * Updates a user's primary identity (User table).
 *
 * @param userId The unique identifier of the user
 * @param changes Partial payload with full_name, user_name, or image
 */
export async function updateUser(
    userId: string,
    changes: { full_name?: string; user_name?: string | null; image?: string | null }
) {
  const set: Partial<typeof user.$inferInsert> = {};

  // Usamos as propriedades exatas definidas no schema.ts (`name` e `username`)
  if (changes.full_name !== undefined) set.name = changes.full_name;
  if (changes.user_name !== undefined) set.username = changes.user_name;
  if (changes.image !== undefined) set.image = changes.image;

  if (Object.keys(set).length > 0) {
    await db
        .update(user)
        .set({ ...set }) // Os timestamps já vêm tratados pelo spread ...timestamps do schema, ou podes deixar se necessário
        .where(eq(user.id, userId)); // O Drizzle usa "user.id" para apontar para a coluna "user_id"
  }
}