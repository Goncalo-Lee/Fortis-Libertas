import { mysqlTable, timestamp, primaryKey, foreignKey } from "drizzle-orm/mysql-core";
import { tag } from "./tag";
import { financialRecord } from "./financialRecord";
import { uuidBinary } from "../types";

export const tagFinancialRecord = mysqlTable(
    "tag__financial_record",
    {
        tagId: uuidBinary("tag_id"),
        recordId: uuidBinary("record_id"),
        createdAt: timestamp("created_at").defaultNow(),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.tagId, table.recordId] }),

        // Custom short names to bypass the 64-character limit
        tagFk: foreignKey({
            name: "fk_tag_fin_rec_tag",
            columns: [table.tagId],
            foreignColumns: [tag.id],
        }).onDelete("cascade"),

        recordFk: foreignKey({
            name: "fk_tag_fin_rec_record",
            columns: [table.recordId],
            foreignColumns: [financialRecord.id],
        }).onDelete("cascade"),
    })
);