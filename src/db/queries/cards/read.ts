import { and, asc, count, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { bankAccount, bankAccountUser, card, color } from "@/db/schema";
import type { ListFiltersCard } from "./type";

/* ======
  READ
======= */

// `card_number` and `cvv` are write-only: only the last four digits leave the database.
const cardColumns = {
  id: card.id,
  bankId: card.bankId,
  userId: card.userId,
  cardholderName: card.cardholderName,
  typeCard: card.typeCard,
  cardNumberLast4: sql<string | null>`RIGHT(${card.cardNumber}, 4)`,
  expiryDate: card.expiryDate,
  frozenAt: card.frozenAt,
  colorId: card.colorId,
  colorName: color.name,
  colorCode: color.codeColor,
  colorReserved: color.isReserved,
  bankName: bankAccount.name,
  role: bankAccountUser.role,
  createdAt: card.createdAt,
  updatedAt: card.updatedAt,
};

// A card is visible to active members of its (non-deleted) bank account.
const visibleTo = (userId: string) =>
  and(
    isNull(card.deletedAt),
    isNull(bankAccount.deletedAt),
    eq(bankAccountUser.userId, userId),
    isNull(bankAccountUser.deletedAt),
  );

/** One card visible to the caller, with their role on the bank account, or `null`. */
export async function getCard(cardId: string, userId: string) {
  const [row] = await db
    .select(cardColumns)
    .from(card)
    .innerJoin(bankAccount, eq(bankAccount.id, card.bankId))
    .innerJoin(bankAccountUser, eq(bankAccountUser.bankId, card.bankId))
    .innerJoin(color, eq(color.id, card.colorId))
    .where(and(eq(card.id, cardId), visibleTo(userId)))
    .limit(1);
  return row ?? null;
}

/** Page of cards visible to the caller and the total. `id` breaks sort ties. */
export async function listCards(userId: string, f: ListFiltersCard) {
  const where = and(
    visibleTo(userId),
    f.bankAccountId ? eq(card.bankId, f.bankAccountId) : undefined,
    f.bankId ? eq(card.bankId, f.bankId) : undefined,
    f.typeCard ? eq(card.typeCard, f.typeCard) : undefined,
    f.frozen === undefined ? undefined : f.frozen ? isNotNull(card.frozenAt) : isNull(card.frozenAt),
    f.mine ? eq(card.userId, userId) : undefined,
  );

  const order = {
    cardholder_name: asc(card.cardholderName),
    "-cardholder_name": desc(card.cardholderName),
    created_at: asc(card.createdAt),
    "-created_at": desc(card.createdAt),
  }[f.sort];

  const rows = await db
    .select(cardColumns)
    .from(card)
    .innerJoin(bankAccount, eq(bankAccount.id, card.bankId))
    .innerJoin(bankAccountUser, eq(bankAccountUser.bankId, card.bankId))
    .innerJoin(color, eq(color.id, card.colorId))
    .where(where)
    .orderBy(order, asc(card.id))
    .limit(f.limit)
    .offset(f.offset);

  const [totalRow] = await db
    .select({ total: count() })
    .from(card)
    .innerJoin(bankAccount, eq(bankAccount.id, card.bankId))
    .innerJoin(bankAccountUser, eq(bankAccountUser.bankId, card.bankId))
    .where(where);

  return { rows, total: totalRow?.total ?? 0 };
}
