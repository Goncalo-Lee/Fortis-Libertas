import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import { uuidBinary } from "../types";
import { timestamps } from "../columns";

/**
 * Global catalog of colors used to identify record types and categories.
 * Seeded with the database (see `src/db/data/seed_catalogs.ts`); read-only through the API.
 */
export const color = mysqlTable("color", {
    id: uuidBinary("color_id").primaryKey(),
    name: t.varchar("name", { length: 50 }).notNull(),
    codeColor: t.char("code_color", { length: 7 }).notNull(), // #RRGGBB
    isReserved: t.boolean("is_reserved").notNull().default(false),
    ...timestamps,
}, (table) => [
    t.uniqueIndex("idx_color_name").on(table.name),
    t.uniqueIndex("idx_color_code_color").on(table.codeColor),
]);
