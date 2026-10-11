import { mysqlTable, mysqlEnum, timestamp, primaryKey } from "drizzle-orm/mysql-core";
import { user } from "./user";
import { dashboard } from "./dashboard";
import { uuidBinary } from "../types";


export const userDashboard = mysqlTable("user__dashboard", {
    dashboardId: uuidBinary("dashboard_id").references(() => dashboard.id, { onDelete: "cascade" }),
    userId: uuidBinary("user_id").references(() => user.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["owner", "editor", "viewer"]),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
}, (table) => ({
    pk: primaryKey({ columns: [table.dashboardId, table.userId] }),
}));