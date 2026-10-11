import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";

export const tagCategory = mysqlTable("tag__category", {
    tagId: uuidBinary("tag_id").notNull(),
    categoryId: uuidBinary("category_id").notNull(),
    createdAt: t.timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
}, (table) => [
    t.primaryKey({ columns: [table.tagId, table.categoryId] }),

    t.foreignKey({
        name: "fk_tag_category_tag",
        columns: [table.tagId],
        foreignColumns: [s.tag.id],
    }).onDelete("cascade"),

    t.foreignKey({
        name: "fk_tag_category_category",
        columns: [table.categoryId],
        foreignColumns: [s.category.id],
    }).onDelete("cascade"),

    t.index("idx_tag_category_category_id").on(table.categoryId),
]);
