import { mysqlTable, varchar, char, text, decimal, mysqlEnum, timestamp } from "drizzle-orm/mysql-core";
import { user } from "./user";
import { dashboard } from "./dashboard";
import { recordType } from "./recordType";
import { category } from "./category";
import { paymentMethod } from "./paymentMethod";
import { installmentPlan } from "./installmentPlan";

export const financialRecord = mysqlTable("financial_record", {
    id: varchar("financial_record_id", { length: 36 }).primaryKey(),
    dashboardId: varchar("dashboard_id", { length: 36 }).references(() => dashboard.id, { onDelete: "cascade" }),
    registerById: varchar("register_by_id", { length: 36 }).references(() => user.id, { onDelete: "restrict" }),
    recordTypeId: varchar("record_type_id", { length: 36 }).references(() => recordType.id, { onDelete: "restrict" }),
    categoryId: varchar("category_id", { length: 36 }).references(() => category.id, { onDelete: "restrict" }),
    paymentMethodId: char("payment_method_id", { length: 26 }).references(() => paymentMethod.id, { onDelete: "restrict" }),
    installmentPlanId: varchar("installment_plan_id", { length: 36 }).references(() => installmentPlan.id, { onDelete: "set null" }),
    name: varchar("name", { length: 50 }),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }),
    paymentDate: timestamp("payment_date"),
    status: mysqlEnum("status", ["active", "settled", "cancelled", "pending", "paid", "late"]),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});