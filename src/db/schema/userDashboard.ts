import { mysqlTable, varchar, mysqlEnum, timestamp, primaryKey } from "drizzle-orm/mysql-core";
import { user } from "./user";
import { dashboard } from "./dashboard";

export const userDashboard = mysqlTable("user__dashboard", {
    dashboardId: varchar("dashboard_id", { length: 36 }).references(() => dashboard.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).references(() => user.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["owner", "editor", "viewer"]),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
}, (table) => ({
    pk: primaryKey({ columns: [table.dashboardId, table.userId] }),
}));