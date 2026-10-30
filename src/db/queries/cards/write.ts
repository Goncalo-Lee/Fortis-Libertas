import { db } from "@/db";
import {bankAccountUser, card } from "@/db/schema";
import { generateId } from "@/db/types";
import { getCardById } from "./read";
import { and, eq, isNull, sql } from "drizzle-orm";
import { ApiError } from "@/lib/api/errors";


/* ======
  WRITE
======= */

export interface UpdateCardInput {
    cardholderName?: string;
    typeCard?: "credit" | "debit";
    cardNumber?: string | null;
    expiryDate?: string | null;
    cvv?: string | null;
}

/**
 * Updates an existing card.
 * Caller must be the card owner or an 'owner' of the associated bank account.
 * Note: 'bank_id' cannot be modified per specification (Section 7.5).
 */
export async function updateCard(
    cardId: string,
    callerUserId: string,
    changes: UpdateCardInput
) {
    // Verifies existence and access
    const current = await getCardById(cardId, callerUserId);
    if (!current) return null;

    // Check permissions: either owner of the card or owner in bank_account__user
    const [hasPermission] = await db
        .select({
            isCardOwner: sql<boolean>`${card.userId} = UUID_TO_BIN(${callerUserId})`,
            isBankOwner: sql<boolean>`${bankAccountUser.role} = 'owner'`,
        })
        .from(card)
        .innerJoin(bankAccountUser, eq(card.bankId, bankAccountUser.bankId))
        .where(
            and(
                eq(card.id, sql`UUID_TO_BIN(${cardId})`),
                eq(bankAccountUser.userId, sql`UUID_TO_BIN(${callerUserId})`),
                isNull(card.deletedAt)
            )
        )
        .limit(1);

    if (!hasPermission || (!hasPermission.isCardOwner && !hasPermission.isBankOwner)) {
        throw new ApiError("FORBIDDEN");
    }

    const set: Partial<typeof card.$inferInsert> = {};
    if (changes.cardholderName !== undefined) set.cardholderName = changes.cardholderName;
    if (changes.typeCard !== undefined) set.typeCard = changes.typeCard;
    if (changes.cardNumber !== undefined) set.cardNumber = changes.cardNumber;
    if (changes.expiryDate !== undefined) set.expiryDate = changes.expiryDate;
    if (changes.cvv !== undefined) set.cvv = changes.cvv;

    if (Object.keys(set).length > 0) {
        await db
            .update(card)
            .set({ ...set, updatedAt: new Date() })
            .where(
                and(
                    eq(card.id, sql`UUID_TO_BIN(${cardId})`),
                    isNull(card.deletedAt)
                )
            );
    }

    return getCardById(cardId, callerUserId);
}

/**
 * Soft-deletes a card and sets card_id = NULL on referencing payment methods.
 * Mirrors ON DELETE SET NULL per specification (Section 7.5).
 */
export async function softDeleteCard(cardId: string, callerUserId: string) {
    const current = await getCardById(cardId, callerUserId);
    if (!current) return;

    // Check permissions
    const [hasPermission] = await db
        .select({
            isCardOwner: sql<boolean>`${card.userId}
            = UUID_TO_BIN(
            ${callerUserId}
            )`,
            isBankOwner: sql<boolean>`${bankAccountUser.role}
            = 'owner'`,
        })
        .from(card)
        .innerJoin(bankAccountUser, eq(card.bankId, bankAccountUser.bankId))
        .where(
            and(
                eq(card.id, sql`UUID_TO_BIN
                (
                ${cardId}
                )`),
                eq(bankAccountUser.userId, sql`UUID_TO_BIN
                (
                ${callerUserId}
                )`),
                isNull(card.deletedAt)
            )
        )
        .limit(1);
}

/**
 * Freezes or unfreezes a card.
 */
export async function setCardFrozenState(cardId: string, userId: string, freeze: boolean) {
    const current = await getCardById(cardId, userId);
    if (!current) return null;

    await db
        .update(card)
        .set({
            frozenAt: freeze ? new Date() : null,
            updatedAt: new Date(),
        })
        .where(eq(card.id, sql`UUID_TO_BIN(${cardId})`));

    return getCardById(cardId, userId);
}

export interface CreateCardInput {
    cardholderName: string;
    typeCard: "credit" | "debit";
    cardNumber?: string | null;
    expiryDate?: string | null;
    cvv?: string | null;
    userId: string;
}

/**
 * Creates a new card associated with a bank account and a user.
 *
 * @param bankAccountId The bank account ID where the card will be issued
 * @param callerUserId The user ID making the request (for retrieving the created record)
 * @param input The card details and owner user ID
 * @returns The newly created card
 */
export async function createCard(
    bankAccountId: string,
    callerUserId: string,
    input: CreateCardInput
) {
    const id = generateId();

    await db.insert(card).values({
        id,
        bankId: sql`UUID_TO_BIN(${bankAccountId})`,
        userId: sql`UUID_TO_BIN(${input.userId})`,
        cardholderName: input.cardholderName,
        typeCard: input.typeCard,
        cardNumber: input.cardNumber ?? null,
        expiryDate: input.expiryDate ?? null,
        cvv: input.cvv ?? null,
    });

    return getCardById(id, callerUserId);
}