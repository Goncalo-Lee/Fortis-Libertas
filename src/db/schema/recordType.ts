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
    colorId: uuidBinary("color_id").notNull(),
    iconId: uuidBinary("icon_id").notNull(),
    ...softDelete,
    ...timestamps,
}, (table) => [
    t.foreignKey({
        name: "fk_record_type_dashboard",
        columns: [table.dashboardId],
        foreignColumns: [s.dashboard.id],
    }).onDelete("cascade"),

    t.foreignKey({
        name: "fk_record_type_color",
        columns: [table.colorId],
        foreignColumns: [s.color.id],
    }).onDelete("restrict"),

    t.foreignKey({
        name: "fk_record_type_icon",
        columns: [table.iconId],
        foreignColumns: [s.icon.id],
    }).onDelete("restrict"),

    t.uniqueIndex("idx_record_type_dashboard_name").on(table.dashboardId, table.name),
    t.uniqueIndex("idx_record_type_dashboard_color").on(table.dashboardId, table.colorId),
    t.index("idx_record_type_dashboard_id").on(table.dashboardId),
    t.index("idx_record_type_icon_id").on(table.iconId),
]);
