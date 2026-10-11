import { mysqlTable, mysqlEnum, char, date, timestamp } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import { user } from "./user";
import { bankAccount } from "./bankAccount";
import {uuidBinary} from "../types";


export const card = mysqlTable("card", {
    id: uuidBinary("card_id").primaryKey(),
    bankId: uuidBinary("bank_id").references(() => bankAccount.id, { onDelete: "restrict" }),
    userId: uuidBinary("user_id").references(() => user.id, { onDelete: "restrict" }),
    cardholderName: t.varchar("cardholder_name", { length: 50 }),
    typeCard: mysqlEnum("type_card", ["credit", "debit"]),
    cardNumber: char("card_number", { length: 16 }),
    expiryDate: date("expiry_date"),
    cvv: char("cvv", { length: 3 }),
    frozenAt: timestamp("frozen_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});