import { mysqlTable, varchar, timestamp, primaryKey } from "drizzle-orm/mysql-core";
import { tag } from "./tag";
import { category } from "./category";

export const tagCategory = mysqlTable("tag__category", {
    tagId: varchar("tag_id", { length: 36 }).references(() => tag.id, { onDelete: "cascade" }),
    categoryId: varchar("category_id", { length: 36 }).references(() => category.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
    pk: primaryKey({ columns: [table.tagId, table.categoryId] }),
}));