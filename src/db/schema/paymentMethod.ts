import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";
import { softDelete, timestamps } from "../columns";

export const paymentMethod = mysqlTable("payment_method", {
    id: uuidBinary("payment_method_id").primaryKey(),
    dashboardId: uuidBinary("dashboard_id").notNull(),
    cardId: uuidBinary("card_id"),
    name: t.varchar("name", { length: 50 }).notNull(),
    description: t.text("description"),
    ...softDelete,
    ...timestamps,
}, (table) => [
    t.foreignKey({
        name: "fk_payment_method_dashboard",
        columns: [table.dashboardId],
        foreignColumns: [s.dashboard.id],
    }).onDelete("cascade"),

    t.foreignKey({
        name: "fk_payment_method_card",
        columns: [table.cardId],
        foreignColumns: [s.card.id],
    }).onDelete("set null"),

    t.uniqueIndex("idx_payment_method_dashboard_name").on(table.dashboardId, table.name),
    t.index("idx_payment_method_dashboard_id").on(table.dashboardId),
    t.index("idx_payment_method_card_id").on(table.cardId),
]);
