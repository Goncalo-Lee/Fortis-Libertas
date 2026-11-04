import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { financialRecord, installmentPlan, transaction as history } from "@/db/schema";
import { syncFinancialRecordTransaction, syncInstallmentPlanTransaction } from "@/db/queries/transactions/write";

/**
 * One-off: creates the history entries (`Transaction`) of the financial records and installment plans that were
 * saved before the history was written automatically. Deleted sources are included, with their `deleted_at`.
 *
 * Safe to run more than once: it only picks sources without an entry, and the sync is an upsert anyway.
 *
 *   npm run db:backfill:transactions
 */
async function backfillTransactions() {
  console.log("🌱 Backfilling the transaction history...");

  try {
    // LEFT JOIN + "entry is null" = sources that have no history entry yet.
    const records = await db
      .select({ id: financialRecord.id })
      .from(financialRecord)
      .leftJoin(history, and(eq(history.sourceType, "financial_record"), eq(history.sourceId, financialRecord.id)))
      .where(isNull(history.id));

    const plans = await db
      .select({ id: installmentPlan.id })
      .from(installmentPlan)
      .leftJoin(history, and(eq(history.sourceType, "installment_plan"), eq(history.sourceId, installmentPlan.id)))
      .where(isNull(history.id));

    // All in one transaction: if anything fails, nothing is half done.
    await db.transaction(async (tx) => {
      for (const { id } of records) await syncFinancialRecordTransaction(tx, id);
      for (const { id } of plans) await syncInstallmentPlanTransaction(tx, id);
    });

    console.log(`✅ Created ${records.length} financial record and ${plans.length} installment plan entries.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error running backfill:", error);
    process.exit(1);
  }
}

backfillTransactions();
