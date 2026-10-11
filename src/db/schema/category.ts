import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { softDelete, timestamps } from "../columns";
import { uuidBinary } from "../types";

export const category = mysqlTable("category", {
    id: uuidBinary("category_id").primaryKey(),
    dashboardId: uuidBinary("dashboard_id").notNull(),
    name: t.varchar("name", { length: 50 }).notNull(),
    description: t.text("description"),
    ...softDelete,
    ...timestamps,
}, (table) => [
    t.foreignKey({
        name: "fk_category_dashboard",
        columns: [table.dashboardId],
        foreignColumns: [s.dashboard.id],
    }).onDelete("cascade"),

    t.uniqueIndex("idx_category_dashboard_name").on(table.dashboardId, table.name),
    t.index("idx_category_dashboard_id").on(table.dashboardId),
]);
