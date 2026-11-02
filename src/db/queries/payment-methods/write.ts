import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { card, financialRecord, paymentMethod } from "@/db/schema";
import { generateId } from "@/db/types";
import { ApiError } from "@/lib/api/errors";
import { inDashboard, nameTaken } from "../utils";
import { getPaymentMethod } from "./read";
import type { CreatePaymentMethodInput, UpdatePaymentMethodInput } from "./type";

/* ======
  WRITE
======= */

/** The linked card must be a non-deleted card of the payment method's creator. */
async function assertCardOfUser(cardId: string, userId: string) {
  const [row] = await db
    .select({ id: card.id })
    .from(card)
    .where(and(eq(card.id, cardId), eq(card.userId, userId), isNull(card.deletedAt)))
    .limit(1);

  if (!row) {
    throw new ApiError("VALIDATION_ERROR", "Card not found.", [
      { pointer: "/card_id", message: "Must be one of your cards." },
    ]);
  }
}

/**
 * Creates a payment method owned by the caller.
 *
 * @throws {ApiError} `NAME_ALREADY_EXISTS` if the name is taken in the dashboard; `VALIDATION_ERROR` (`/card_id`)
 *   if the card is not a non-deleted card of the caller
 */
export async function createPaymentMethod(dashboardId: string, userId: string, input: CreatePaymentMethodInput) {
  if (await nameTaken({ table: paymentMethod, dashboardId, name: input.name })) {
    throw new ApiError("NAME_ALREADY_EXISTS");
  }
  if (input.cardId) await assertCardOfUser(input.cardId, userId);

  const id = generateId();
  try {
    await db.insert(paymentMethod).values({
      id,
      dashboardId,
      userId,
      cardId: input.cardId ?? null,
      name: input.name,
      description: input.description ?? "",
    });
  } catch (error) {
    // Two concurrent requests can pass the check above; the unique index rejects the second one.
    if (await nameTaken({ table: paymentMethod, dashboardId, name: input.name, exceptId: id })) {
      throw new ApiError("NAME_ALREADY_EXISTS");
    }
    throw error;
  }

  return getPaymentMethod(dashboardId, id);
}

/**
 * Updates a payment method. `user_id` never changes; a new card must belong to its creator.
 *
 * @returns The updated payment method, or `null` if it does not exist
 * @throws {ApiError} `NAME_ALREADY_EXISTS`; `VALIDATION_ERROR` (`/card_id`)
 */
export async function updatePaymentMethod(dashboardId: string, id: string, changes: UpdatePaymentMethodInput) {
  const current = await getPaymentMethod(dashboardId, id);
  if (!current) return null;

  const set: Partial<typeof paymentMethod.$inferInsert> = {};

  if (changes.name !== undefined && changes.name !== current.name) set.name = changes.name;
  if (changes.description !== undefined) set.description = changes.description;
  if (changes.cardId !== undefined) {
    if (changes.cardId !== null) await assertCardOfUser(changes.cardId, current.userId);
    set.cardId = changes.cardId;
  }

  if (set.name !== undefined && (await nameTaken({ table: paymentMethod, dashboardId, name: set.name, exceptId: id }))) {
    throw new ApiError("NAME_ALREADY_EXISTS");
  }

  if (Object.keys(set).length > 0) {
    try {
      await db
        .update(paymentMethod)
        .set({ ...set, updatedAt: new Date() })
        .where(inDashboard(paymentMethod, dashboardId, id));
    } catch (error) {
      if (set.name !== undefined && (await nameTaken({ table: paymentMethod, dashboardId, name: set.name, exceptId: id }))) {
        throw new ApiError("NAME_ALREADY_EXISTS");
      }
      throw error;
    }
  }

  return getPaymentMethod(dashboardId, id);
}

/**
 * Soft-deletes a payment method (emulates `RESTRICT`).
 *
 * @throws {ApiError} `IN_USE` while a non-deleted financial record references it
 */
export async function softDeletePaymentMethod(dashboardId: string, id: string) {
  const [used] = await db
    .select({ id: financialRecord.id })
    .from(financialRecord)
    .where(and(eq(financialRecord.paymentMethodId, id), isNull(financialRecord.deletedAt)))
    .limit(1);

  if (used) throw new ApiError("IN_USE");

  await db
    .update(paymentMethod)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(inDashboard(paymentMethod, dashboardId, id));
}
