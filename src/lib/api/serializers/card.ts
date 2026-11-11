import type { CardRow } from "@/db/queries/cards";
import { toIso } from "./common";

/**
 * Serializes a card. `card_number` and `cvv` are write-only and never appear here.
 * `color` uses the same shape as the categories (every card has one).
 * `bank_name` saves the apps one request to show the bank on the card.
 */
export function serializeCard(row: CardRow) {
  return {
    card_id: row.id,
    bank_id: row.bankId,
    bank_name: row.bankName,
    user_id: row.userId,
    cardholder_name: row.cardholderName,
    type_card: row.typeCard,
    card_number_last4: row.cardNumberLast4,
    expiry_date: row.expiryDate,
    color_id: row.colorId,
    color: { color_id: row.colorId, name: row.colorName, code_color: row.colorCode, is_reserved: row.colorReserved },
    frozen_at: toIso(row.frozenAt),
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  };
}
