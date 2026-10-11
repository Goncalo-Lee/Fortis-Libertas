import { mysqlTable, decimal, int, mysqlEnum, timestamp } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import { user } from "./user";
import { dashboard } from "./dashboard";
import {uuidBinary} from "../types";

export const installmentPlan = mysqlTable("installment_plan", {
    id: uuidBinary("installment_plan_id").primaryKey(),
    dashboardId: uuidBinary("dashboard_id").references(() => dashboard.id, { onDelete: "cascade" }),
    registerById: uuidBinary("register_by_id").references(() => user.id, { onDelete: "restrict" }),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
    totalInstallments: int("total_installments"),
    dueDate: timestamp("due_date"),
    status: mysqlEnum("status", ["pending"]).default("pending"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});