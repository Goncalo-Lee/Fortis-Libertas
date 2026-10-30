import { sql } from "drizzle-orm";
import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";

/** Cache of the exchange rates of the external provider (Frankfurter / ECB). */
export const exchangeRate = mysqlTable("exchange_rate", {
    rateDate: t.date("rate_date", { mode: "string" }).notNull(),
    baseCurrencyId: uuidBinary("base_currency_id").notNull(),
    quoteCurrencyId: uuidBinary("quote_currency_id").notNull(),
    rate: t.decimal("rate", { precision: 18, scale: 8 }).notNull(),
    source: t.varchar("source", { length: 50 }).notNull().default("frankfurter"),
    createdAt: t.timestamp("created_at", { fsp: 3 }).notNull().defaultNow(),
}, (table) => [
    t.primaryKey({ columns: [table.rateDate, table.baseCurrencyId, table.quoteCurrencyId] }),

    t.foreignKey({
        name: "fk_exchange_rate_base_currency",
        columns: [table.baseCurrencyId],
        foreignColumns: [s.currency.id],
    }).onDelete("restrict"),

    t.foreignKey({
        name: "fk_exchange_rate_quote_currency",
        columns: [table.quoteCurrencyId],
        foreignColumns: [s.currency.id],
    }).onDelete("restrict"),

    t.check("chk_exchange_rate_currencies", sql`${table.baseCurrencyId} <> ${table.quoteCurrencyId}`),

    t.index("idx_exchange_rate_quote_currency_id").on(table.quoteCurrencyId),
]);
