import { mysqlTable, timestamp, primaryKey } from "drizzle-orm/mysql-core";
import { tag } from "./tag";
import { category } from "./category";
import {uuidBinary} from "../types";

export const tagCategory = mysqlTable("tag__category", {
    tagId: uuidBinary("tag_id").references(() => tag.id, { onDelete: "cascade" }),
    categoryId: uuidBinary("category_id").references(() => category.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
    pk: primaryKey({ columns: [table.tagId, table.categoryId] }),
}));