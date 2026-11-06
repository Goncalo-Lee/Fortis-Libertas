import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";

/** Which categories can be used with which record types (M:N). */
export const recordTypeCategory = mysqlTable("record_type__category", {
    recordTypeId: uuidBinary("record_type_id").notNull(),
    categoryId: uuidBinary("category_id").notNull(),
    createdAt: t.timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
}, (table) => [
    t.primaryKey({ columns: [table.recordTypeId, table.categoryId] }),

    t.foreignKey({
        name: "fk_record_type_category_record_type",
        columns: [table.recordTypeId],
        foreignColumns: [s.recordType.id],
    }).onDelete("cascade"),

    t.foreignKey({
        name: "fk_record_type_category_category",
        columns: [table.categoryId],
        foreignColumns: [s.category.id],
    }).onDelete("cascade"),

    t.index("idx_record_type_category_category_id").on(table.categoryId),
]);
