import { db } from "@/db";
import { card, bankAccountUser } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

/* ======
  READ
======= */

/**
 * Retrieves a card by its ID, checking that the user belongs to its bank account.
 */
export async function getCardById(cardId: string, userId: string) {
    const [row] = await db
        .select({
            id: card.id,
            bankId: card.bankId,
            userId: card.userId,
            cardholderName: card.cardholderName,
            typeCard: card.typeCard,
            cardNumberLast4: sql<string>`RIGHT(${card.cardNumber}, 4)`,
            expiryDate: card.expiryDate,
            frozenAt: card.frozenAt,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
        })
        .from(card)
        .innerJoin(bankAccountUser, eq(card.bankId, bankAccountUser.bankId))
        .where(
            and(
                eq(card.id, sql`UUID_TO_BIN(${cardId})`),
                eq(bankAccountUser.userId, sql`UUID_TO_BIN(${userId})`),
                isNull(card.deletedAt)
            )
        )
        .limit(1);

    return row ?? null;
}

/**
 * Lists cards owned by the calling user.
 */
export async function getCardsByUserId(userId: string, filter?: { bankId?: string; typeCard?: "credit" | "debit" }) {
    const conditions = [
        eq(card.userId, sql`UUID_TO_BIN(${userId})`),
        isNull(card.deletedAt),
    ];

    if (filter?.bankId) conditions.push(eq(card.bankId, sql`UUID_TO_BIN(${filter.bankId})`));
    if (filter?.typeCard) conditions.push(eq(card.typeCard, filter.typeCard));

    return db
        .select({
            id: card.id,
            bankId: card.bankId,
            userId: card.userId,
            cardholderName: card.cardholderName,
            typeCard: card.typeCard,
            cardNumberLast4: sql<string>`RIGHT(
            ${card.cardNumber},
            4
            )`,
            expiryDate: card.expiryDate,
            frozenAt: card.frozenAt,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
        })
        .from(card)
        .where(and(...conditions));
}

/**
 * Lists cards of a specific bank account.
 */
export async function getCardsByBankAccountId(bankAccountId: string, userId: string) {
    return db
        .select({
            id: card.id,
            bankId: card.bankId,
            userId: card.userId,
            cardholderName: card.cardholderName,
            typeCard: card.typeCard,
            cardNumberLast4: sql<string>`RIGHT(
            ${card.cardNumber},
            4
            )`,
            expiryDate: card.expiryDate,
            frozenAt: card.frozenAt,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
        })
        .from(card)
        .innerJoin(bankAccountUser, eq(card.bankId, bankAccountUser.bankId))
        .where(
            and(
                eq(card.bankId, sql`UUID_TO_BIN
                (
                ${bankAccountId}
                )`),
                eq(bankAccountUser.userId, sql`UUID_TO_BIN
                (
                ${userId}
                )`),
                isNull(card.deletedAt)
            )
        );
}