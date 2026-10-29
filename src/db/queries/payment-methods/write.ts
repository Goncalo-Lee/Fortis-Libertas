// src/db/queries/payment-methods/read.ts
import { db } from "@/db";
import { paymentMethod, card } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { inDashboard } from "../utils";

/* ======
  READ
======= */

/**
 * Retrieves a single active payment method by its ID within a dashboard.
 *
 * @param dashboardId The unique identifier of the dashboard owning the payment method
 * @param id The unique identifier of the payment method
 * @returns The payment method with its associated card (if any), or null
 */
export async function getPaymentMethod(dashboardId: string, id: string) {
    const [row] = await db
        .select({
            id: paymentMethod.id,
            dashboardId: paymentMethod.dashboardId,
            cardId: paymentMethod.cardId,
            name: paymentMethod.name,
            description: paymentMethod.description,
            createdAt: paymentMethod.createdAt,
            updatedAt: paymentMethod.updatedAt,
            card: {
                cardholderName: card.cardholderName,
                typeCard: card.typeCard,
                cardNumber: card.cardNumber,
            },
        })
        .from(paymentMethod)
        .leftJoin(card, eq(paymentMethod.cardId, card.id))
        .where(
            and(
                inDashboard(paymentMethod, dashboardId, id),
                isNull(paymentMethod.deletedAt)
            )
        )
        .limit(1);

    return row ?? null;
}

/**
 * Retrieves all active payment methods belonging to a specific dashboard.
 *
 * @param dashboardId The unique identifier of the dashboard
 * @returns An array of active payment methods
 */
export async function getPaymentMethodsByDashboardId(dashboardId: string) {
    return await db
        .select({
            id: paymentMethod.id,
            dashboardId: paymentMethod.dashboardId,
            cardId: paymentMethod.cardId,
            name: paymentMethod.name,
            description: paymentMethod.description,
            createdAt: paymentMethod.createdAt,
            updatedAt: paymentMethod.updatedAt,
            card: {
                cardholderName: card.cardholderName,
                typeCard: card.typeCard,
                cardNumber: card.cardNumber,
            },
        })
        .from(paymentMethod)
        .leftJoin(card, eq(paymentMethod.cardId, card.id))
        .where(
            and(
                eq(paymentMethod.dashboardId, sql`UUID_TO_BIN(${dashboardId})`),
                isNull(paymentMethod.deletedAt)
            )
        );
}