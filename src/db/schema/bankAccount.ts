import { mysqlTable, varchar, decimal, timestamp } from "drizzle-orm/mysql-core";

export const bankAccount = mysqlTable("bank_account", {
    id: varchar("bank_account_id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 50 }),
    initialBalance: decimal("initial_balance", { precision: 10, scale: 2 }),
    frozenAt: timestamp("frozen_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});