import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";
import { softDelete, timestamps } from "../columns";

export const installmentPlan = mysqlTable("installment_plan", {
  id: uuidBinary("installment_plan_id", { length: 36 }).primaryKey(),
  dashboardId: uuidBinary("dashboard_id", { length: 36 }).references(() => s.dashboard.id, { onDelete: "cascade" }).notNull(),
  registerById: uuidBinary("register_by_id", { length: 36 }).references(() => s.user.id, { onDelete: "restrict" }).notNull(),
  totalAmount: t.decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  totalInstallments: t.int("total_installments").notNull(),
  dueDate: t.date("due_date").notNull(),
  status: t.mysqlEnum("status", ["cancelled", "pending", "paid", "late"]).default("pending").notNull(),
  ...softDelete,
  ...timestamps,
}, (table) => [
  t.index("idx_installment_plan_dashboard_id").on(table.dashboardId),
  t.index("idx_installment_plan_register_by_id").on(table.registerById),
  t.index("idx_installment_plan_due_date").on(table.dueDate),
  t.index("idx_installment_plan_status").on(table.status),
]);
