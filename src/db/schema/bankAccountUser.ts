import { mysqlTable, mysqlEnum, timestamp, primaryKey } from "drizzle-orm/mysql-core";
import { user } from "./user";
import { bankAccount } from "./bankAccount";
import {uuidBinary} from "../types";


export const bankAccountUser = mysqlTable("bank_account__user", {
    bankId: uuidBinary("bank_id").references(() => bankAccount.id, { onDelete: "cascade" }),
    userId: uuidBinary("user_id").references(() => user.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["owner", "editor", "viewer"]),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
}, (table) => ({
    pk: primaryKey({ columns: [table.bankId, table.userId] }),
}));