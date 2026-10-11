import { mysqlTable, text, decimal, mysqlEnum, timestamp, varchar, foreignKey } from "drizzle-orm/mysql-core";
import { user } from "./user";
import { dashboard } from "./dashboard";
import { recordType } from "./recordType";
import { category } from "./category";
import { paymentMethod } from "./paymentMethod";
import { installmentPlan } from "./installmentPlan";
import { uuidBinary } from "../types";

export const financialRecord = mysqlTable(
    "financial_record",
    {
        id: uuidBinary("financial_record_id").primaryKey(),
        dashboardId: uuidBinary("dashboard_id"),
        registerById: uuidBinary("register_by_id"),
        recordTypeId: uuidBinary("record_type_id"),
        categoryId: uuidBinary("category_id"),
        paymentMethodId: uuidBinary("payment_method_id"),
        installmentPlanId: uuidBinary("installment_plan_id"),
        name: varchar("name", { length: 50 }),
        description: text("description"),
        price: decimal("price", { precision: 10, scale: 2 }),
        currency: varchar("currency", { length: 3 }),
        paymentDate: timestamp("payment_date"),
        status: mysqlEnum("status", ["active", "settled", "cancelled", "pending", "paid", "late"]),
        deletedAt: timestamp("deleted_at"),
        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at").onUpdateNow(),
    },
    (table) => ({
        dashboardFk: foreignKey({
            name: "fk_fin_rec_dashboard",
            columns: [table.dashboardId],
            foreignColumns: [dashboard.id],
        }).onDelete("cascade"),

        registerByFk: foreignKey({
            name: "fk_fin_rec_user",
            columns: [table.registerById],
            foreignColumns: [user.id],
        }).onDelete("restrict"),

        recordTypeFk: foreignKey({
            name: "fk_fin_rec_rec_type",
            columns: [table.recordTypeId],
            foreignColumns: [recordType.id],
        }).onDelete("restrict"),

        categoryFk: foreignKey({
            name: "fk_fin_rec_category",
            columns: [table.categoryId],
            foreignColumns: [category.id],
        }).onDelete("restrict"),

        paymentMethodFk: foreignKey({
            name: "fk_fin_rec_pay_method",
            columns: [table.paymentMethodId],
            foreignColumns: [paymentMethod.id],
        }).onDelete("restrict"),

        installmentPlanFk: foreignKey({
            name: "fk_fin_rec_inst_plan",
            columns: [table.installmentPlanId],
            foreignColumns: [installmentPlan.id],
        }).onDelete("set null"),
    })
);