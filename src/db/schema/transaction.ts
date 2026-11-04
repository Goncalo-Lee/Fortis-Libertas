import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";
import { softDelete, timestamps } from "../columns";

/**
 * Financial history of the whole dashboard: a snapshot of each movement of a source row
 * (financial record, installment plan, ...). `source_type` + `source_id` have no foreign key,
 * so new kinds of source need no migration.
 */
export const transaction = mysqlTable("transaction", {
    id: uuidBinary("transaction_id").primaryKey(),
    dashboardId: uuidBinary("dashboard_id").notNull(),
    userId: uuidBinary("user_id").notNull(),
    recordTypeId: uuidBinary("record_type_id").notNull(),
    sourceType: t.varchar("source_type", { length: 50 }).notNull(),
    sourceId: uuidBinary("source_id").notNull(),
    name: t.varchar("name", { length: 50 }).notNull(),
    amount: t.decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currencyId: uuidBinary("currency_id").notNull(),
    occurredAt: t.timestamp("occurred_at", { fsp: 3 }).notNull(),
    ...softDelete,
    ...timestamps,
}, (table) => [
    t.foreignKey({
        name: "fk_transaction_dashboard",
        columns: [table.dashboardId],
        foreignColumns: [s.dashboard.id],
    }).onDelete("cascade"),

    t.foreignKey({
        name: "fk_transaction_user",
        columns: [table.userId],
        foreignColumns: [s.user.id],
    }).onDelete("restrict"),

    t.foreignKey({
        name: "fk_transaction_record_type",
        columns: [table.recordTypeId],
        foreignColumns: [s.recordType.id],
    }).onDelete("restrict"),

    t.foreignKey({
        name: "fk_transaction_currency",
        columns: [table.currencyId],
        foreignColumns: [s.currency.id],
    }).onDelete("restrict"),

    t.uniqueIndex("idx_transaction_source").on(table.sourceType, table.sourceId),
    t.index("idx_transaction_dashboard_occurred").on(table.dashboardId, table.occurredAt),
    t.index("idx_transaction_record_type_id").on(table.recordTypeId),
    t.index("idx_transaction_user_id").on(table.userId),
]);
