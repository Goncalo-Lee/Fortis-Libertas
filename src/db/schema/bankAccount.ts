import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import { softDelete, timestamps } from "../columns";
import { uuidBinary } from "../types";

export const bankAccount = mysqlTable("bank_account", {
  id: uuidBinary("bank_account_id").primaryKey(),
  name: t.varchar("name", { length: 50 }).notNull(),
  initialBalance: t.decimal("initial_balance", { precision: 10, scale: 2 }).notNull(),
  frozenAt: t.timestamp("frozen_at", {fsp: 3}),
  ...softDelete,
  ...timestamps,
});
