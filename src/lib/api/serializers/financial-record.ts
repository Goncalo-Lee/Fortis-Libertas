import type { FinancialRecordRow } from "@/db/queries/financial-records";
import type { Converted } from "@/lib/exchange";
import { toIso } from "./common";

type Named = { id: string; name: string };

export type RecordExtras = {
  tags: Named[];
  converted: Converted | null;
  /** Only the summaries asked for with `include` are present */
  include?: {
    recordType?: Named;
    category?: Named;
    paymentMethod?: Named;
    installmentPlan?: Named | null;
  };
};

/** Serializes a financial record. `price` stays in the original currency; `converted` is in the caller's. */
export function serializeFinancialRecord(row: FinancialRecordRow, extras: RecordExtras) {
  const { include } = extras;

  return {
    financial_record_id: row.id,
    dashboard_id: row.dashboardId,
    register_by_id: row.registerById,
    record_type_id: row.recordTypeId,
    category_id: row.categoryId,
    payment_method_id: row.paymentMethodId,
    installment_plan_id: row.installmentPlanId,
    name: row.name,
    description: row.description,
    price: String(row.price),
    currency: row.currency,
    converted: extras.converted,
    payment_date: toIso(row.paymentDate),
    status: row.status,
    tags: extras.tags.map((t) => ({ tag_id: t.id, name: t.name })),
    ...(include?.recordType ? { record_type: { record_type_id: include.recordType.id, name: include.recordType.name } } : {}),
    ...(include?.category ? { category: { category_id: include.category.id, name: include.category.name } } : {}),
    ...(include?.paymentMethod
      ? { payment_method: { payment_method_id: include.paymentMethod.id, name: include.paymentMethod.name } }
      : {}),
    ...(include && "installmentPlan" in include
      ? {
          installment_plan: include.installmentPlan
            ? { installment_plan_id: include.installmentPlan.id, name: include.installmentPlan.name }
            : null,
        }
      : {}),
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  };
}
