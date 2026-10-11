import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";
import { softDelete, timestamps } from "../columns";

export const recordType = mysqlTable("record_type", {
    id: uuidBinary("record_type_id").primaryKey(),
    dashboardId: uuidBinary("dashboard_id").notNull(),
    name: t.varchar("name", { length: 50 }).notNull(),
    description: t.text("description"),
    ...softDelete,
    ...timestamps,
}, (table) => [
    t.foreignKey({
        name: "fk_record_type_dashboard",
        columns: [table.dashboardId],
        foreignColumns: [s.dashboard.id],
    }).onDelete("cascade"),

    t.uniqueIndex("idx_record_type_dashboard_name").on(table.dashboardId, table.name),
    t.index("idx_record_type_dashboard_id").on(table.dashboardId),
]);
