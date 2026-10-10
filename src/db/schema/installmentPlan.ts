import { mysqlTable, varchar, decimal, int, mysqlEnum, timestamp } from "drizzle-orm/mysql-core";
import { user } from "./user";
import { dashboard } from "./dashboard";

export const installmentPlan = mysqlTable("installment_plan", {
    id: varchar("installment_plan_id", { length: 36 }).primaryKey(),
    dashboardId: varchar("dashboard_id", { length: 36 }).references(() => dashboard.id, { onDelete: "cascade" }),
    registerById: varchar("register_by_id", { length: 36 }).references(() => user.id, { onDelete: "restrict" }),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
    totalInstallments: int("total_installments"),
    dueDate: timestamp("due_date"),
    status: mysqlEnum("status", ["pending"]).default("pending"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});