import type { getFinancialRecord } from "./read";

/* ======
  TYPE
======= */

export type RecordStatus = "active" | "settled" | "cancelled" | "pending" | "paid" | "late";

/** Record with its currency code. */
export type FinancialRecordRow = NonNullable<Awaited<ReturnType<typeof getFinancialRecord>>>;

/** `include` values of the list and detail endpoints. */
export type RecordInclude = "record_type" | "category" | "payment_method" | "installment_plan";

/** Filters of `listFinancialRecords`. Lists are "any of"; `installmentPlanId: "none"` keeps records without a plan. */
export interface ListFiltersFinancialRecord {
  recordTypeIds?: string[];
  categoryIds?: string[];
  paymentMethodIds?: string[];
  installmentPlanId?: string | "none";
  registerById?: string;
  tagIds?: string[];
  tagMatch?: "any" | "all";
  status?: RecordStatus[];
  currency?: string;
  paymentDateFrom?: Date;
  paymentDateTo?: Date;
  minPrice?: string;
  maxPrice?: string;
  q?: string;
  sort:
    | "payment_date"
    | "-payment_date"
    | "price"
    | "-price"
    | "name"
    | "-name"
    | "created_at"
    | "-created_at";
  limit: number;
  offset: number;
}

export interface CreateFinancialRecordInput {
  /** Optional only when `installmentPlanId` is set (inherited from the plan) */
  recordTypeId?: string;
  categoryId?: string;
  paymentMethodId: string;
  installmentPlanId?: string | null;
  name: string;
  description?: string | null;
  /** Decimal string, e.g. "40.00" */
  price: string;
  /** Currency code; defaults to the caller's profile currency */
  currency?: string;
  paymentDate: Date;
  status: RecordStatus;
  tagIds?: string[];
}

export interface UpdateFinancialRecordInput {
  recordTypeId?: string;
  categoryId?: string;
  paymentMethodId?: string;
  installmentPlanId?: string | null;
  name?: string;
  description?: string | null;
  price?: string;
  currency?: string;
  paymentDate?: Date;
  status?: RecordStatus;
}
