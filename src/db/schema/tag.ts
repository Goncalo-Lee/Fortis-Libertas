import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";
import { softDelete, timestamps } from "../columns";

export const tag = mysqlTable("tag", {
    id: uuidBinary("tag_id").primaryKey(),
    dashboardId: uuidBinary("dashboard_id").notNull(),
    name: t.varchar("name", { length: 50 }).notNull(),
    description: t.text("description"),
    ...softDelete,
    ...timestamps,
}, (table) => [
    t.foreignKey({
        name: "fk_tag_dashboard",
        columns: [table.dashboardId],
        foreignColumns: [s.dashboard.id],
    }).onDelete("cascade"),

    t.uniqueIndex("idx_tag_dashboard_name").on(table.dashboardId, table.name),
    t.index("idx_tag_dashboard_id").on(table.dashboardId),
]);
