import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";
import { softDelete, timestamps } from "../columns";

export const card = mysqlTable("card", {
  id: uuidBinary("card_id").primaryKey(),
  bankId: uuidBinary("bank_id").references(() => s.bankAccount.id, { onDelete: "restrict" }),
  userId: uuidBinary("user_id").references(() => s.user.id, { onDelete: "restrict" }),
  cardholderName: t.varchar("cardholder_name", { length: 50 }).notNull(),
  typeCard: t.mysqlEnum("type_card", ["credit", "debit"]).notNull(),
  cardNumber: t.char("card_number", { length: 16 }),
  expiryDate: t.date("expiry_date"),
  cvv: t.char("cvv", { length: 3 }),
  frozenAt: t.timestamp("frozen_at"),
  ...softDelete,
  ...timestamps,
}, (table) => [
  t.index("idx_card_bank_id").on(table.bankId),
  t.index("idx_card_user_id").on(table.userId),
]);
