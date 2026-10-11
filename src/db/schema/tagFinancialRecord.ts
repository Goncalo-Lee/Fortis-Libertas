import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";

export const tagFinancialRecord = mysqlTable("tag__financial_record", {
    tagId: uuidBinary("tag_id").references(() => s.tag.id, { onDelete: "cascade" }).notNull(),
    recordId: uuidBinary("record_id").references(() => s.financialRecord.id, { onDelete: "cascade" }).notNull(),
    createdAt: t.timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
}, (table) => [
    t.primaryKey({ columns: [table.tagId, table.recordId] }),
    t.index("idx_tag_financial_record_record_id").on(table.recordId),
]);