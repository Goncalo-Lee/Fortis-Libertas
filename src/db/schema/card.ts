import { mysqlTable, varchar, mysqlEnum, char, date, timestamp } from "drizzle-orm/mysql-core";
import { user } from "./user";
import { bankAccount } from "./bankAccount";

export const card = mysqlTable("card", {
    id: varchar("card_id", { length: 36 }).primaryKey(),
    bankId: varchar("bank_id", { length: 36 }).references(() => bankAccount.id, { onDelete: "restrict" }),
    userId: varchar("user_id", { length: 36 }).references(() => user.id, { onDelete: "restrict" }),
    cardholderName: varchar("cardholder_name", { length: 50 }),
    typeCard: mysqlEnum("type_card", ["credit", "debit"]),
    cardNumber: char("card_number", { length: 16 }),
    expiryDate: date("expiry_date"),
    cvv: char("cvv", { length: 3 }),
    frozenAt: timestamp("frozen_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});