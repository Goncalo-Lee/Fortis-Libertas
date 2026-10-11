import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";
import { softDelete, timestamps } from "../columns";

export const card = mysqlTable("card", {
    id: uuidBinary("card_id").primaryKey(),
    bankId: uuidBinary("bank_id"),
    userId: uuidBinary("user_id"),
    cardholderName: t.varchar("cardholder_name", { length: 50 }).notNull(),
    typeCard: t.mysqlEnum("type_card", ["credit", "debit"]).notNull(),
    cardNumber: t.char("card_number", { length: 16 }),
    expiryDate: t.date("expiry_date"),
    cvv: t.char("cvv", { length: 3 }),
    frozenAt: t.timestamp("frozen_at"),
    ...softDelete,
    ...timestamps,
}, (table) => [
    t.foreignKey({
        name: "fk_card_bank",
        columns: [table.bankId],
        foreignColumns: [s.bankAccount.id],
    }).onDelete("restrict"),

    t.foreignKey({
        name: "fk_card_user",
        columns: [table.userId],
        foreignColumns: [s.user.id],
    }).onDelete("restrict"),

    t.index("idx_card_bank_id").on(table.bankId),
    t.index("idx_card_user_id").on(table.userId),
]);
