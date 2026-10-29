// src/db/queries/payment-methods/read.ts
import { db } from "@/db";
import { paymentMethod, card } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

/**
 * Procura todos os métodos de pagamento ativos de um dashboard,
 * trazendo opcionalmente detalhes básicos do cartão associado.
 */
export async function getPaymentMethodsByDashboardId(dashboardId: string) {
    return db
        .select({
            id: paymentMethod.id,
            dashboardId: paymentMethod.dashboardId,
            cardId: paymentMethod.cardId,
            name: paymentMethod.name,
            description: paymentMethod.description,
            createdAt: paymentMethod.createdAt,
            updatedAt: paymentMethod.updatedAt,
            // Opcional: Dados do cartão associado caso exista
            card: {
                cardholderName: card.cardholderName,
                typeCard: card.typeCard,
                cardNumber: card.cardNumber,
            },
        })
        .from(paymentMethod)
        .leftJoin(
            card,
            eq(paymentMethod.cardId, card.id)
        )
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