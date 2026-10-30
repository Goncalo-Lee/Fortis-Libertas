import { db } from "@/db";
import { paymentMethod, card } from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

export async function getPaymentMethod(dashboardId: string, id: string) {
    const [row] = await db
        .select({
            id: paymentMethod.id,
            dashboardId: paymentMethod.dashboardId,
            name: paymentMethod.name,
            description: paymentMethod.description,
            createdAt: paymentMethod.createdAt,
            updatedAt: paymentMethod.updatedAt,
            card: {
                id: card.id,
                cardholderName: card.cardholderName,
                typeCard: card.typeCard,
                cardNumber: card.cardNumber,
            }
        })
        .from(paymentMethod)
        .leftJoin(card, eq(paymentMethod.cardId, card.id))
        .where(
            and(
                eq(paymentMethod.dashboardId, sql`UUID_TO_BIN(${dashboardId})`),
                eq(paymentMethod.id, sql`UUID_TO_BIN(${id})`),
                isNull(paymentMethod.deletedAt)
            )
        )
        .limit(1);

    return row ?? null;
}

export async function getPaymentMethodsByDashboardId(dashboardId: string) {
    return db
        .select({
            id: paymentMethod.id,
            dashboardId: paymentMethod.dashboardId,
            name: paymentMethod.name,
            description: paymentMethod.description,
            createdAt: paymentMethod.createdAt,
            updatedAt: paymentMethod.updatedAt,
            card: {
                id: card.id,
                cardholderName: card.cardholderName,
                typeCard: card.typeCard,
                cardNumber: card.cardNumber,
            }
        })
        .from(paymentMethod)
        .leftJoin(card, eq(paymentMethod.cardId, card.id))
        .where(
            and(
                eq(paymentMethod.dashboardId, sql`UUID_TO_BIN
                (
                ${dashboardId}
                )`),
                isNull(paymentMethod.deletedAt)
            )
        );
}