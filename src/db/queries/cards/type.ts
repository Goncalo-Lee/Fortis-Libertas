import type { getCard } from "./read";

/* ======
  TYPE
======= */

export type TypeCard = "credit" | "debit";

/** Card as the caller sees it: `role` is the caller's role on the card's bank account. */
export type CardRow = NonNullable<Awaited<ReturnType<typeof getCard>>>;

/** Filters of `listCards`. `bankAccountId` scopes to one account; `mine` keeps only cards owned by the caller. */
export interface ListFiltersCard {
  bankAccountId?: string;
  bankId?: string;
  typeCard?: TypeCard;
  frozen?: boolean;
  mine?: boolean;
  sort: "cardholder_name" | "-cardholder_name" | "created_at" | "-created_at";
  limit: number;
  offset: number;
}

export interface CreateCardInput {
  cardholderName: string;
  typeCard: TypeCard;
  /** Write-only, 16 digits */
  cardNumber?: string | null;
  /** YYYY-MM-DD */
  expiryDate?: string | null;
  /** Write-only, 3 digits */
  cvv?: string | null;
  /** Card owner; must be a member of the bank account. Defaults to the caller. */
  userId?: string;
}

export interface UpdateCardInput {
  cardholderName?: string;
  typeCard?: TypeCard;
  cardNumber?: string | null;
  expiryDate?: string | null;
  cvv?: string | null;
}
