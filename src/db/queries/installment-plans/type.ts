import type { getInstallmentPlan } from "./read";

/* ======
  TYPE
======= */

export type PlanStatus = "cancelled" | "pending" | "paid" | "late";

/** Plan with its currency code. */
export type InstallmentPlanRow = NonNullable<Awaited<ReturnType<typeof getInstallmentPlan>>>;

/** Filters of `listInstallmentPlans`. */
export interface ListFiltersInstallmentPlan {
  q?: string;
  status?: PlanStatus[];
  /** Inclusive `YYYY-MM-DD` bounds on `due_date` */
  dueFrom?: string;
  dueTo?: string;
  sort: "due_date" | "-due_date" | "total_amount" | "-total_amount" | "created_at" | "-created_at";
  limit: number;
  offset: number;
}

export interface CreateInstallmentPlanInput {
  name: string;
  description?: string | null;
  categoryId: string;
  /** Currency code; defaults to the caller's profile currency */
  currency?: string;
  tagIds?: string[];
  /** Decimal string, e.g. "1200.00" */
  totalAmount: string;
  totalInstallments: number;
  /** YYYY-MM-DD */
  dueDate: string;
  status?: PlanStatus;
}

export interface UpdateInstallmentPlanInput {
  name?: string;
  description?: string | null;
  categoryId?: string;
  currency?: string;
  totalAmount?: string;
  totalInstallments?: number;
  dueDate?: string;
  status?: PlanStatus;
}
