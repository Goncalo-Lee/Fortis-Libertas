import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import { uuidBinary } from "../types";
import { timestamps } from "../columns";

/** Global catalog of the supported currencies (ISO 4217 codes: EUR, USD, GBP, BRL). */
export const currency = mysqlTable("currency", {
    id: uuidBinary("currency_id").primaryKey(),
    code: t.char("code", { length: 3 }).notNull(),
    name: t.varchar("name", { length: 50 }).notNull(),
    symbol: t.varchar("symbol", { length: 5 }).notNull(),
    ...timestamps,
}, (table) => [
    t.uniqueIndex("idx_currency_code").on(table.code),
]);
