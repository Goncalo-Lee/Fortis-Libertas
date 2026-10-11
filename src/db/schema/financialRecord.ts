import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { softDelete, timestamps } from "../columns";
import { uuidBinary } from "../types";

export const financialRecord = mysqlTable("financial_record", {
    id: uuidBinary("financial_record_id").primaryKey(),
    dashboardId: uuidBinary("dashboard_id").notNull(),
    registerById: uuidBinary("register_by_id").notNull(),
    recordTypeId: uuidBinary("record_type_id").notNull(),
    categoryId: uuidBinary("category_id").notNull(),
    paymentMethodId: uuidBinary("payment_method_id").notNull(),
    installmentPlanId: uuidBinary("installment_plan_id"),
    name: t.varchar("name", { length: 50 }).notNull(),
    description: t.text("description"),
    price: t.decimal("price", { precision: 10, scale: 2 }).notNull(),
    currency: t.varchar("currency", { length: 3 }).notNull(),
    paymentDate: t.timestamp("payment_date", { fsp: 3 }).notNull(),
    status: t.mysqlEnum("status", ["active", "settled", "cancelled", "pending", "paid", "late"]).notNull(),
    ...softDelete,
    ...timestamps,
}, (table) => [
    t.foreignKey({
        name: "fk_financial_record_dashboard",
        columns: [table.dashboardId],
        foreignColumns: [s.dashboard.id],
    }).onDelete("cascade"),

    t.foreignKey({
        name: "fk_financial_record_register_by",
        columns: [table.registerById],
        foreignColumns: [s.user.id],
    }).onDelete("restrict"),

    t.foreignKey({
        name: "fk_financial_record_record_type",
        columns: [table.recordTypeId],
        foreignColumns: [s.recordType.id],
    }).onDelete("restrict"),

    t.foreignKey({
        name: "fk_financial_record_category",
        columns: [table.categoryId],
        foreignColumns: [s.category.id],
    }).onDelete("restrict"),

    t.foreignKey({
        name: "fk_financial_record_payment_method",
        columns: [table.paymentMethodId],
        foreignColumns: [s.paymentMethod.id],
    }).onDelete("restrict"),

    t.foreignKey({
        name: "fk_financial_record_installment_plan",
        columns: [table.installmentPlanId],
        foreignColumns: [s.installmentPlan.id],
    }).onDelete("set null"),

    t.index("idx_financial_record_dashboard_id").on(table.dashboardId),
    t.index("idx_financial_record_register_by_id").on(table.registerById),
    t.index("idx_financial_record_record_type_id").on(table.recordTypeId),
    t.index("idx_financial_record_category_id").on(table.categoryId),
    t.index("idx_financial_record_payment_method_id").on(table.paymentMethodId),
    t.index("idx_financial_record_installment_plan_id").on(table.installmentPlanId),
    t.index("idx_financial_record_payment_date").on(table.paymentDate),
    t.index("idx_financial_record_status").on(table.status),
]);
