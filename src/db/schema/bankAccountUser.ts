import { mysqlTable, varchar, mysqlEnum, timestamp, primaryKey } from "drizzle-orm/mysql-core";
import { user } from "./user";
import { bankAccount } from "./bankAccount";

export const bankAccountUser = mysqlTable("bank_account__user", {
    bankId: varchar("bank_id", { length: 36 }).references(() => bankAccount.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).references(() => user.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["owner", "editor", "viewer"]),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
}, (table) => ({
    pk: primaryKey({ columns: [table.bankId, table.userId] }),
}));