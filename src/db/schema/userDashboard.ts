import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";
import { softDelete, timestamps } from "../columns";

export const userDashboard = mysqlTable("user__dashboard", {
    dashboardId: uuidBinary("dashboard_id").notNull(),
    userId: uuidBinary("user_id").notNull(),
    role: t.mysqlEnum("role", ["owner", "editor", "viewer"]).notNull(),
    ...softDelete,
    ...timestamps,
}, (table) => [
    t.primaryKey({ columns: [table.dashboardId, table.userId] }),

    t.foreignKey({
        name: "fk_user_dashboard_dashboard",
        columns: [table.dashboardId],
        foreignColumns: [s.dashboard.id],
    }).onDelete("cascade"),

    t.foreignKey({
        name: "fk_user_dashboard_user",
        columns: [table.userId],
        foreignColumns: [s.user.id],
    }).onDelete("cascade"),

    t.index("idx_user_dashboard_user_id").on(table.userId),
]);
