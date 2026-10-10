import { mysqlTable, varchar, timestamp, primaryKey } from "drizzle-orm/mysql-core";
import { tag } from "./tag";
import { financialRecord } from "./financialRecord";

export const tagFinancialRecord = mysqlTable("tag__financial_record", {
    tagId: varchar("tag_id", { length: 36 }).references(() => tag.id, { onDelete: "cascade" }),
    recordId: varchar("record_id", { length: 36 }).references(() => financialRecord.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
    pk: primaryKey({ columns: [table.tagId, table.recordId] }),
}));