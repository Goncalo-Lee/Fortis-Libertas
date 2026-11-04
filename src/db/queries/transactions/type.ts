/**
 * Kinds of source rows that write an entry in the history (endpoints.md, section 20).
 * `source_type` is a varchar validated here, so savings, debts and goals can be added later without a migration.
 */
export const SOURCE_TYPES = ["financial_record", "installment_plan"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export type ListTransactionsFilters = {
  sourceTypes?: SourceType[];
  recordTypeId?: string;
  userId?: string;
  occurredFrom?: Date;
  occurredTo?: Date;
  /** `true` -> only entries whose source was deleted; `false` -> only the others; `undefined` -> all. */
  deleted?: boolean;
  sort: "occurred_at" | "-occurred_at";
  limit: number;
  offset: number;
};
