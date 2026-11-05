import type { PaymentMethodRow } from "@/db/queries/payment-methods";
import { toIso } from "./common";

export function serializePaymentMethod(row: PaymentMethodRow) {
  return {
    payment_method_id: row.id,
    dashboard_id: row.dashboardId,
    user_id: row.userId,
    card_id: row.cardId,
    name: row.name,
    description: row.description ?? "",
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  };
}
