import { z } from "zod";

const cardholderName = z.string().trim().min(1).max(50);
const typeCard = z.enum(["credit", "debit"]);
const expiryDate = z.iso.date().nullable();
const cvv = z.string().regex(/^\d{3}$/, "Must be 3 digits.").nullable();
// Existence and "not reserved" are checked against the database (assertColorUsable).
const colorId = z.guid().transform((v) => v.toLowerCase());

/** Luhn checksum over a digit string. */
function luhnValid(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

const cardNumber = z
  .string()
  .regex(/^\d{16}$/, "Must be 16 digits.")
  .refine(luhnValid, { message: "Invalid card number." })
  .nullable();

export const createCardSchema = z.strictObject({
  cardholder_name: cardholderName,
  type_card: typeCard,
  card_number: cardNumber.optional(),
  expiry_date: expiryDate.optional(),
  cvv: cvv.optional(),
  user_id: z.guid().transform((v) => v.toLowerCase()).optional(),
  color_id: colorId.optional(),
});

export const updateCardSchema = z
  .strictObject({
    cardholder_name: cardholderName,
    type_card: typeCard,
    card_number: cardNumber,
    expiry_date: expiryDate,
    cvv,
    color_id: colorId,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required." });

const sort = z.enum(["cardholder_name", "-cardholder_name", "created_at", "-created_at"]).default("-created_at");
const frozen = z
  .enum(["true", "false"])
  .transform((v) => v === "true")
  .optional();

/** Query of GET /bank-accounts/{id}/cards. */
export const listBankAccountCardsQuery = z.looseObject({ type_card: typeCard.optional(), frozen, sort });

/** Query of GET /cards (adds `bank_id`). */
export const listCardsQuery = z.looseObject({
  bank_id: z.guid().transform((v) => v.toLowerCase()).optional(),
  type_card: typeCard.optional(),
  frozen,
  sort,
});
