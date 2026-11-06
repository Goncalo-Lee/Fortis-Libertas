import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import { uuidBinary } from "../types";
import { timestamps } from "../columns";

/**
 * Global catalog of icons used to identify record types and categories.
 * `codeIcon` is a Material Symbols name in snake_case (e.g. `shopping_cart`).
 */
export const icon = mysqlTable("icon", {
    id: uuidBinary("icon_id").primaryKey(),
    name: t.varchar("name", { length: 50 }).notNull(),
    codeIcon: t.varchar("code_icon", { length: 50 }).notNull(),
    ...timestamps,
}, (table) => [
    t.uniqueIndex("idx_icon_name").on(table.name),
    t.uniqueIndex("idx_icon_code_icon").on(table.codeIcon),
]);
