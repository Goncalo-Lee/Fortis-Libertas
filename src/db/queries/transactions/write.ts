import { eq } from "drizzle-orm";
import { financialRecord, installmentPlan, transaction as history } from "@/db/schema";
import { generateId } from "@/db/types";
import type { Tx } from "../memberships";
import type { SourceType } from "./type";

/* =======
  WRITE
======== */

/*
 * The history keeps ONE entry per source row (unique index on `source_type` + `source_id`).
 *
 * Instead of one function for create, another for update and another for delete, each source has a single
 * "sync" function that reads the source row as it is NOW, inside the transaction, and copies it into its entry:
 * - create      -> no entry yet, so it is inserted
 * - update      -> the entry exists, so the snapshot is refreshed (ON DUPLICATE KEY UPDATE)
 * - soft delete -> the source now has `deleted_at`, so the entry gets it too
 *
 * Because it copies the final state, it does not matter which fields changed: the entry cannot drift from its source.
 * It must always be called with the `tx` of the change, so both are saved or rolled back together.
 */

type Snapshot = {
  dashboardId: string;
  userId: string;
  recordTypeId: string;
  sourceType: SourceType;
  sourceId: string;
  name: string;
  amount: string;
  currencyId: string;
  occurredAt: Date;
  deletedAt: Date | null;
};

/** Inserts the entry of a source, or refreshes it when it already exists. */
async function upsertSnapshot(tx: Tx, s: Snapshot) {
  await tx
    .insert(history)
    .values({ id: generateId(), ...s })
    .onDuplicateKeyUpdate({
      // `user_id` (who registered the movement) and `created_at` keep their first value.
      set: {
        recordTypeId: s.recordTypeId,
        name: s.name,
        amount: s.amount,
        currencyId: s.currencyId,
        occurredAt: s.occurredAt,
        deletedAt: s.deletedAt,
        updatedAt: new Date(),
      },
    });
}

/** Copies a financial record into its history entry. `occurred_at` is the payment date. */
export async function syncFinancialRecordTransaction(tx: Tx, recordId: string) {
  const [r] = await tx
    .select({
      dashboardId: financialRecord.dashboardId,
      userId: financialRecord.registerById,
      recordTypeId: financialRecord.recordTypeId,
      name: financialRecord.name,
      amount: financialRecord.price,
      currencyId: financialRecord.currencyId,
      occurredAt: financialRecord.paymentDate,
      deletedAt: financialRecord.deletedAt,
    })
    .from(financialRecord)
    .where(eq(financialRecord.id, recordId))
    .limit(1);
  if (!r) return;

  await upsertSnapshot(tx, { ...r, amount: String(r.amount), sourceType: "financial_record", sourceId: recordId });
}

/**
 * Copies an installment plan into its history entry.
 * `amount` is the plan's total and `occurred_at` its due date (a day, stored as midnight UTC).
 */
export async function syncInstallmentPlanTransaction(tx: Tx, planId: string) {
  const [p] = await tx
    .select({
      dashboardId: installmentPlan.dashboardId,
      userId: installmentPlan.registerById,
      recordTypeId: installmentPlan.recordTypeId,
      name: installmentPlan.name,
      amount: installmentPlan.totalAmount,
      currencyId: installmentPlan.currencyId,
      dueDate: installmentPlan.dueDate,
      deletedAt: installmentPlan.deletedAt,
    })
    .from(installmentPlan)
    .where(eq(installmentPlan.id, planId))
    .limit(1);
  if (!p) return;

  const { dueDate, ...rest } = p;
  await upsertSnapshot(tx, {
    ...rest,
    amount: String(p.amount),
    occurredAt: new Date(`${dueDate}T00:00:00.000Z`),
    sourceType: "installment_plan",
    sourceId: planId,
  });
}
