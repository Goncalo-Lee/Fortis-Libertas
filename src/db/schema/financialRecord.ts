import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { softDelete, timestamps } from "../columns";
import { uuidBinary } from "../types";

export const financialRecord = mysqlTable("financial_record", {
  id: uuidBinary("financial_record_id").primaryKey(),
  dashboardId: uuidBinary("dashboard_id").references(() => s.dashboard.id, { onDelete: "cascade" }).notNull(),
  registerById: uuidBinary("register_by_id").references(() => s.user.id, { onDelete: "restrict" }).notNull(),
  recordTypeId: uuidBinary("record_type_id").references(() => s.recordType.id, { onDelete: "restrict" }).notNull(),
  categoryId: uuidBinary("category_id").references(() => s.category.id, { onDelete: "restrict" }).notNull(),
  paymentMethodId: uuidBinary("payment_method_id").references(() => s.paymentMethod.id, { onDelete: "restrict" }).notNull(),
  installmentPlanId: uuidBinary("installment_plan_id").references(() => s.installmentPlan.id, { onDelete: "set null" }),
  name: t.varchar("name", { length: 50 }).notNull(),
  description: t.text("description"),
  price: t.decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: t.varchar("currency", { length: 3 }).notNull(),
  paymentDate: t.timestamp("payment_date", { fsp: 3 }).notNull(),
  status: t.mysqlEnum("status", ["active", "settled", "cancelled", "pending", "paid", "late"]).notNull(),
  ...softDelete,
  ...timestamps,
}, (table) => [
  t.index("idx_financial_record_dashboard_id").on(table.dashboardId),
  t.index("idx_financial_record_register_by_id").on(table.registerById),
  t.index("idx_financial_record_record_type_id").on(table.recordTypeId),
  t.index("idx_financial_record_category_id").on(table.categoryId),
  t.index("idx_financial_record_payment_method_id").on(table.paymentMethodId),
  t.index("idx_financial_record_installment_plan_id").on(table.installmentPlanId),
  t.index("idx_financial_record_payment_date").on(table.paymentDate),
  t.index("idx_financial_record_status").on(table.status),
]);
