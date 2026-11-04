import { changedFields, logBankAccountActivity } from "../activity-logs/write";
import type { Tx } from "../memberships";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { bankAccountUser, card, paymentMethod } from "@/db/schema";
import { generateId } from "@/db/types";
import { ApiError } from "@/lib/api/errors";
import { getCard } from "./read";
import type { CreateCardInput, UpdateCardInput } from "./type";

/* ======
  WRITE
======= */

/**
 * Creates a card on a bank account. The owner defaults to the caller and must be an active member.
 *
 * @throws {ApiError} `VALIDATION_ERROR` (`/user_id`) when the owner is not a member of the account
 */
export async function createCard(bankAccountId: string, callerUserId: string, input: CreateCardInput) {
  const ownerId = input.userId ?? callerUserId;

  const [member] = await db
    .select({ userId: bankAccountUser.userId })
    .from(bankAccountUser)
    .where(
      and(
        eq(bankAccountUser.bankId, bankAccountId),
        eq(bankAccountUser.userId, ownerId),
        isNull(bankAccountUser.deletedAt),
      ),
    )
    .limit(1);

  if (!member) {
    throw new ApiError("VALIDATION_ERROR", "Card owner must be a member of the bank account.", [
      { pointer: "/user_id", message: "User is not a member of this bank account." },
    ]);
  }

  const id = generateId();
  await db.transaction(async (tx) => {
    await tx.insert(card).values({
      id,
      bankId: bankAccountId,
      userId: ownerId,
      cardholderName: input.cardholderName,
      typeCard: input.typeCard,
      cardNumber: input.cardNumber ?? null,
      expiryDate: input.expiryDate ?? null,
      cvv: input.cvv ?? null,
    });
    // Card data (number, expiry, CVV, holder name) NEVER goes into the log: only the type and whose card it is.
    await logBankAccountActivity(tx, bankAccountId, {
      entityType: "card", entityId: id, action: "created", metadata: { type_card: input.typeCard, card_owner_id: ownerId },
    });
  });

  return getCard(id, callerUserId);
}

/** Updates a card. `bank_id` and `user_id` cannot change. */
export async function updateCard(cardId: string, callerUserId: string, changes: UpdateCardInput) {
  const set: Partial<typeof card.$inferInsert> = {};
  if (changes.cardholderName !== undefined) set.cardholderName = changes.cardholderName;
  if (changes.typeCard !== undefined) set.typeCard = changes.typeCard;
  if (changes.cardNumber !== undefined) set.cardNumber = changes.cardNumber;
  if (changes.expiryDate !== undefined) set.expiryDate = changes.expiryDate;
  if (changes.cvv !== undefined) set.cvv = changes.cvv;

  if (Object.keys(set).length > 0) {
    await db.transaction(async (tx) => {
      const [result] = await tx
        .update(card)
        .set({ ...set, updatedAt: new Date() })
        .where(and(eq(card.id, cardId), isNull(card.deletedAt)));

      // Field NAMES only (e.g. "cvv"), never the new values.
      if (result.affectedRows > 0) {
        await logCard(tx, cardId, "updated", { fields: changedFields(set) });
      }
    });
  }
  return getCard(cardId, callerUserId);
}

/** Soft-deletes a card and clears `card_id` on its payment methods, in one transaction (mirrors SET NULL). */
export async function softDeleteCard(cardId: string) {
  await db.transaction(async (tx) => {
    const [result] = await tx
      .update(card)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(card.id, cardId), isNull(card.deletedAt)));

    await tx.update(paymentMethod).set({ cardId: null }).where(eq(paymentMethod.cardId, cardId));

    if (result.affectedRows > 0) await logCard(tx, cardId, "deleted");
  });
}

/** Idempotent freeze/unfreeze; returns the updated card. */
export async function setCardFrozenState(cardId: string, callerUserId: string, freeze: boolean) {
  const current = await getCard(cardId, callerUserId);
  if (!current) return null;
  if (freeze === Boolean(current.frozenAt)) return current;

  await db.transaction(async (tx) => {
    await tx
      .update(card)
      .set({ frozenAt: freeze ? new Date() : null, updatedAt: new Date() })
      .where(and(eq(card.id, cardId), isNull(card.deletedAt)));
    await logCard(tx, cardId, freeze ? "frozen" : "unfrozen");
  });
  return getCard(cardId, callerUserId);
}

/**
 * Logs a card event in its bank account's log.
 * The card only knows its id here, so the bank account is read inside the same transaction.
 */
async function logCard(tx: Tx, cardId: string, action: string, metadata?: Record<string, unknown>) {
  const [row] = await tx.select({ bankId: card.bankId }).from(card).where(eq(card.id, cardId)).limit(1);
  if (!row) return;
  await logBankAccountActivity(tx, row.bankId, { entityType: "card", entityId: cardId, action, metadata });
}
