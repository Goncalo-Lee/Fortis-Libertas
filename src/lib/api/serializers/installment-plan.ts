import type { InstallmentPlanRow } from "@/db/queries/installment-plans";
import type { Converted } from "@/lib/exchange";
import { toIso } from "./common";

type PlanTag = { id: string; name: string };
type Progress = { recordsCount: number; recordsTotal: string };

/**
 * Serializes a plan. `converted` is `total_amount` in the caller's currency (see `convertPlanTotals`).
 * `progress` is only passed by the detail endpoint.
 */
export function serializeInstallmentPlan(row: InstallmentPlanRow, tags: PlanTag[], progress?: Progress, converted: Converted | null = null) {
  return {
    installment_plan_id: row.id,
    dashboard_id: row.dashboardId,
    register_by_id: row.registerById,
    name: row.name,
    description: row.description,
    category_id: row.categoryId,
    record_type_id: row.recordTypeId,
    currency: row.currency,
    tags: tags.map((t) => ({ tag_id: t.id, name: t.name })),
    total_amount: String(row.totalAmount),
    converted,
    total_installments: row.totalInstallments,
    due_date: row.dueDate,
    status: row.status,
    ...(progress ? { records_count: progress.recordsCount, records_total: progress.recordsTotal } : {}),
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  };
}
