import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { bankAccount, bankAccountUser, profile, session, user } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import { getOrCreateProfile } from "./read";
import { requireCurrencyId, requireLanguageId } from "../catalogs";
import type { ProfileChanges } from "./type";
import type { UpdateMeInput } from "@/lib/api/schemas/user";
import { bankAccountMembership, dashboardMembership, type Membership, type Tx } from "../memberships";

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
 * Updates the user's own identity fields (`User` table): `user_name`, `full_name` and `image`.
 *
 * `user_name` is unique across all users. The check runs twice, the same way tags check their names:
 * 1. Before the UPDATE, so the common case answers with a clean 409.
 * 2. After a failed UPDATE, because two requests can pass step 1 at the same time and the unique index
 *    then lets only one through. If the name is now taken by someone else, the failure was that race.
 *
 * @param userId - The user being updated (always the caller)
 * @param changes - Validated payload of PATCH /me
 * @throws {ApiError} `USER_NAME_TAKEN` when another user already has that `user_name`
 */
export async function updateUser(userId: string, changes: UpdateMeInput) {
  // Map the API's snake_case fields to the schema's property names (`name`, `username`).
  const set: Partial<typeof user.$inferInsert> = {};
  if (changes.full_name !== undefined) set.name = changes.full_name;
  if (changes.user_name !== undefined) set.username = changes.user_name;
  if (changes.image !== undefined) set.image = changes.image;

  if (changes.user_name && (await userNameTaken(changes.user_name, userId))) {
    throw new ApiError("USER_NAME_TAKEN");
  }

  try {
    await db.update(user).set(set).where(eq(user.id, userId));
  } catch (error) {
    if (changes.user_name && (await userNameTaken(changes.user_name, userId))) {
      throw new ApiError("USER_NAME_TAKEN");
    }
    throw error; // Not a name conflict: let withErrors turn it into a 500.
  }
}

/** True when a user other than `exceptUserId` already has `userName` (deleted accounts included: the index covers them). */
async function userNameTaken(userName: string, exceptUserId: string) {
  const [row] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.username, userName), ne(user.id, exceptUserId)))
    .limit(1);
  return Boolean(row);
}

/**
 * Deletes the caller's account (DELETE /me, endpoints.md, section 3.8).
 *
 * In one transaction:
 * 1. Refuse with `LAST_OWNER` if the user is the only owner of a dashboard or bank account that still has
 *    other active members. Those members would be left with nobody able to manage it.
 * 2. Soft-delete the user (`deleted_at`). `requireSession` treats a deleted user as signed out.
 * 3. Physically delete every session, so all devices are signed out at once.
 *
 * Scopes where the user is alone are left as they are: nobody else can see them.
 *
 * @throws {ApiError} `LAST_OWNER` (409) with the kind of scope in `detail`
 */
export async function deleteAccount(userId: string) {
  await db.transaction(async (tx) => {
    if (await blocksAsLastOwner(tx, dashboardMembership, userId)) {
      throw new ApiError("LAST_OWNER", "Transfer ownership of your shared dashboards before deleting the account.");
    }
    if (await blocksAsLastOwner(tx, bankAccountMembership, userId)) {
      throw new ApiError("LAST_OWNER", "Transfer ownership of your shared bank accounts before deleting the account.");
    }

    await tx.update(user).set({ deletedAt: new Date() }).where(eq(user.id, userId));
    await tx.delete(session).where(eq(session.userId, userId));
  });
}

/**
 * True when, in some scope of this membership type, the user is the only active owner
 * and at least one other active member (with a non-deleted account) remains.
 */
async function blocksAsLastOwner(tx: Tx, m: Membership, userId: string) {
  const me = userId.toLowerCase();

  // Scopes where the user is an active owner.
  const owned = tx
    .select({ scope: m.scopeId })
    .from(m.table)
    .where(and(eq(m.table.userId, userId), eq(m.table.role, "owner"), isNull(m.table.deletedAt)));

  // Every active member of those scopes, skipping members whose account is already deleted.
  const members = await tx
    .select({ scope: m.scopeId, userId: m.table.userId, role: m.table.role })
    .from(m.table)
    .innerJoin(user, eq(user.id, m.table.userId))
    .where(and(inArray(m.scopeId, owned), isNull(m.table.deletedAt), isNull(user.deletedAt)));

  // Per scope: does anyone else remain, and is any of them an owner?
  const scopes = new Map<string, { others: number; otherOwners: number }>();
  for (const row of members) {
    const key = String(row.scope);
    const entry = scopes.get(key) ?? { others: 0, otherOwners: 0 };
    if (String(row.userId).toLowerCase() !== me) {
      entry.others += 1;
      if (row.role === "owner") entry.otherOwners += 1;
    }
    scopes.set(key, entry);
  }

  return [...scopes.values()].some((s) => s.others > 0 && s.otherOwners === 0);
}
