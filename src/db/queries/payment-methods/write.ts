// src/db/queries/payment-methods/read.ts
import { db } from "@/db";
import { paymentMethod, card } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import {  nameTaken } from "../utils";
import { generateId } from "@/db/types";
import { ApiError } from "@/lib/api/errors";
import { getPaymentMethod } from "./read";



/**
 * Retrieves all active payment methods belonging to a specific dashboard.
 *
 * @param dashboardId The unique identifier of the dashboard
 * @returns An array of active payment methods
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
                eq(paymentMethod.dashboardId, sql`UUID_TO_BIN
                (
                ${dashboardId}
                )`),
                isNull(paymentMethod.deletedAt)
            )
        );
}

export interface CreatePaymentMethodInput {
    name: string;
    description?: string;
    cardId?: string | null;
}

/**
 * Creates a new payment method inside a dashboard.
 * Associated with the caller as creator (user_id).
 */
export interface CreatePaymentMethodInput {
    name: string;
    description?: string;
    cardId?: string | null;
}

export async function createPaymentMethod(
    dashboardId: string,
    userId: string, // Mantemos como argumento porque a rota passa a sessão, mas não gravamos na tabela
    input: CreatePaymentMethodInput
) {
    if (await nameTaken({ table: paymentMethod, dashboardId, name: input.name })) {
        throw new ApiError("NAME_ALREADY_EXISTS");
    }

    const id = generateId();

    await db.insert(paymentMethod).values({
        id,
        dashboardId: sql`UUID_TO_BIN(${dashboardId})`,
        cardId: input.cardId ? sql`UUID_TO_BIN(${input.cardId})` : null,
        name: input.name,
        description: input.description ?? "",
    });

    return getPaymentMethod(dashboardId, id);
}