import type { InferSelectModel } from "drizzle-orm";
import type { paymentMethod } from "@/db/schema";

/* ======
  TYPE
======= */

export type PaymentMethodRow = InferSelectModel<typeof paymentMethod>;

/** Filters of `listPaymentMethods`. */
export interface ListFiltersPaymentMethod {
  q?: string;
  /** Only payment methods created by this user */
  userId?: string;
  cardId?: string;
  sort: "name" | "-name" | "created_at" | "-created_at";
  limit: number;
  offset: number;
}

export interface CreatePaymentMethodInput {
  name: string;
  description?: string;
  cardId?: string | null;
}

export interface UpdatePaymentMethodInput {
  name?: string;
  description?: string;
  cardId?: string | null;
}
