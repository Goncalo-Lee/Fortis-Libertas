import type { CardRow } from "@/db/queries/cards";
import { toIso } from "./common";

/** Serializes a card. `card_number` and `cvv` are write-only and never appear here. */
export function serializeCard(row: CardRow) {
  return {
    card_id: row.id,
    bank_id: row.bankId,
    user_id: row.userId,
    cardholder_name: row.cardholderName,
    type_card: row.typeCard,
    card_number_last4: row.cardNumberLast4,
    expiry_date: row.expiryDate,
    frozen_at: toIso(row.frozenAt),
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  };
}
