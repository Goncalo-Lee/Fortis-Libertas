import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import { uuidBinary } from "../types";
import { timestamps } from "../columns";

/** Global catalog of the supported languages (BCP 47 codes: `en`, `pt-PT`). */
export const language = mysqlTable("language", {
    id: uuidBinary("language_id").primaryKey(),
    code: t.varchar("code", { length: 10 }).notNull(),
    name: t.varchar("name", { length: 50 }).notNull(),
    ...timestamps,
}, (table) => [
    t.uniqueIndex("idx_language_code").on(table.code),
]);
