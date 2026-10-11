import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";

export const tagCategory = mysqlTable("tag__category", {
    tagId: uuidBinary("tag_id").references(() => s.tag.id, { onDelete: "cascade" }).notNull(),
    categoryId: uuidBinary("category_id").references(() => s.category.id, { onDelete: "cascade" }).notNull(),
    createdAt: t.timestamp("created_at", {fsp: 3}).defaultNow().notNull(),
}, (table) => [
  t.primaryKey({ columns: [table.tagId, table.categoryId] }),
  t.index("idx_tag_category_category_id").on(table.categoryId),
]);
