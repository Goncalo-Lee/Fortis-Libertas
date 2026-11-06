import type { TransactionRow } from "@/db/queries/transactions";
import type { Converted } from "@/lib/exchange";
import { toIso } from "./common";

/**
 * History entry as returned by the API (endpoints.md, section 20.2).
 * `amount` stays in the original currency; `converted` is in the caller's profile currency (or null without a rate).
 */
export function serializeTransaction(row: TransactionRow, converted: Converted | null) {
  return {
    transaction_id: row.id,
    dashboard_id: row.dashboardId,
    user: {
      user_id: row.user.id,
      user_name: row.user.userName,
      full_name: row.user.fullName,
      image: row.user.image,
    },
    record_type: {
      record_type_id: row.recordType.id,
      name: row.recordType.name,
      color: { color_id: row.color.id, name: row.color.name, code_color: row.color.codeColor, is_reserved: row.color.isReserved },
      icon: { icon_id: row.icon.id, name: row.icon.name, code_icon: row.icon.codeIcon },
    },
    source_type: row.sourceType,
    source_id: row.sourceId,
    name: row.name,
    amount: String(row.amount),
    currency: row.currency,
    converted,
    occurred_at: toIso(row.occurredAt),
    deleted_at: toIso(row.deletedAt),
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  };
}
