// src/db/queries/cards.ts
import { db } from "@/db"; // ajusta o import para a tua instância do drizzle
import { card, bankAccount } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

/**
 * Procura todos os cartões associados a contas bancárias de um dashboard específico.
 */
export async function getCardsByDashboardId(dashboardId: string) {
    return db
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
                // Converte a string do dashboardId para o binário do MySQL
                eq(bankAccount.dashboardId, sql`UUID_TO_BIN
                (
                ${dashboardId}
                )`),
                // Filtro de Soft Delete (se o cartão não estiver apagado)
                isNull(card.deletedAt)
            )
        );
}