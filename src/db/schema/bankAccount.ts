import { mysqlTable, decimal, timestamp } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import {uuidBinary} from "../types";

export const bankAccount = mysqlTable("bank_account", {
    id: uuidBinary("bank_account_id").primaryKey(),
    name: t.varchar("name", { length: 50 }),
    initialBalance: decimal("initial_balance", { precision: 10, scale: 2 }),
    frozenAt: timestamp("frozen_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});