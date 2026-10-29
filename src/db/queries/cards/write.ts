// src/db/queries/cards/read.ts
import { db } from "@/db";
import { card, bankAccount } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

/* ======
  READ
======= */

/**
 * Retrieves a single active card by its ID within a dashboard.
 *
 * @param dashboardId The unique identifier of the dashboard owning the card's bank account
 * @param id The unique identifier of the card
 * @returns The card details, or null if not found or soft-deleted
 */
export async function getCard(dashboardId: string, id: string) {
    const [row] = await db
        .select({
            id: card.id,
            bankId: card.bankId,
            userId: card.userId,
            cardholderName: card.cardholderName,
            typeCard: card.typeCard,
            cardNumber: card.cardNumber,
            expiryDate: card.expiryDate,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
        })
        .from(card)
        .innerJoin(
            bankAccount,
            eq(card.bankId, bankAccount.id)
        )
        .where(
            and(
                eq(card.id, id),
                eq(bankAccount.dashboardId, sql`UUID_TO_BIN(${dashboardId})`),
                isNull(card.deletedAt)
            )
        )
        .limit(1);

    return row ?? null;
}

/**
 * Retrieves all active cards associated with bank accounts of a specific dashboard.
 *
 * @param dashboardId The unique identifier of the dashboard
 * @returns An array of active cards
 */
export async function getCardsByDashboardId(dashboardId: string) {
    return await db
        .select({
            id: card.id,
            bankId: card.bankId,
            userId: card.userId,
            cardholderName: card.cardholderName,
            typeCard: card.typeCard,
            cardNumber: card.cardNumber,
            expiryDate: card.expiryDate,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
        })
        .from(card)
        .innerJoin(
            bankAccount,
            eq(card.bankId, bankAccount.id)
        )
        .where(
            and(
                eq(bankAccount.dashboardId, sql`UUID_TO_BIN(${dashboardId})`),
                isNull(card.deletedAt)
            )
        );
}