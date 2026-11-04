import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";
import { softDelete, timestamps } from "../columns";

export const installmentPlan = mysqlTable("installment_plan", {
    id: uuidBinary("installment_plan_id").primaryKey(),
    dashboardId: uuidBinary("dashboard_id").notNull(),
    name: t.varchar("name", { length: 50 }).notNull(),
    description: t.text("description"),
    categoryId: uuidBinary("category_id").notNull(),
    recordTypeId: uuidBinary("record_type_id").notNull(),
    currencyId: uuidBinary("currency_id").notNull(),
    registerById: uuidBinary("register_by_id").notNull(),
    totalAmount: t.decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    totalInstallments: t.int("total_installments").notNull(),
    dueDate: t.date("due_date", { mode: "string" }).notNull(),
    status: t.mysqlEnum("status", ["cancelled", "pending", "paid", "late"]).default("pending").notNull(),
    ...softDelete,
    ...timestamps,
}, (table) => [
    t.foreignKey({
        name: "fk_installment_plan_dashboard",
        columns: [table.dashboardId],
        foreignColumns: [s.dashboard.id],
    }).onDelete("cascade"),

    t.foreignKey({
        name: "fk_installment_plan_register_by",
        columns: [table.registerById],
        foreignColumns: [s.user.id],
    }).onDelete("restrict"),

    t.foreignKey({
        name: "fk_installment_plan_category",
        columns: [table.categoryId],
        foreignColumns: [s.category.id],
    }).onDelete("restrict"),

    t.foreignKey({
        name: "fk_installment_plan_record_type",
        columns: [table.recordTypeId],
        foreignColumns: [s.recordType.id],
    }).onDelete("restrict"),

    t.foreignKey({
        name: "fk_installment_plan_currency",
        columns: [table.currencyId],
        foreignColumns: [s.currency.id],
    }).onDelete("restrict"),

    t.index("idx_installment_plan_dashboard_id").on(table.dashboardId),
    t.index("idx_installment_plan_register_by_id").on(table.registerById),
    t.index("idx_installment_plan_due_date").on(table.dueDate),
    t.index("idx_installment_plan_status").on(table.status),
    t.index("idx_installment_plan_category_id").on(table.categoryId),
    t.index("idx_installment_plan_record_type_id").on(table.recordTypeId),
    t.index("idx_installment_plan_currency_id").on(table.currencyId),
]);
