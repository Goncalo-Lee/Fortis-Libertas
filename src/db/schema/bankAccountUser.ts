import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";
import { timestamps } from "../columns";

export const bankAccountUser = mysqlTable("bank_account__user", {
    bankId: uuidBinary("bank_id").notNull(),
    userId: uuidBinary("user_id").notNull(),
    role: t.mysqlEnum("role", ["owner", "editor", "viewer"]).notNull(),
    ...timestamps,
}, (table) => [
    t.primaryKey({ columns: [table.bankId, table.userId] }),

    t.foreignKey({
        name: "fk_bank_account_user_bank",
        columns: [table.bankId],
        foreignColumns: [s.bankAccount.id],
    }).onDelete("cascade"),

    t.foreignKey({
        name: "fk_bank_account_user_user",
        columns: [table.userId],
        foreignColumns: [s.user.id],
    }).onDelete("cascade"),

    t.index("idx_bank_account_user_user_id").on(table.userId),
]);
