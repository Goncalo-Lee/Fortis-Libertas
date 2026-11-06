import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { softDelete, timestamps } from "../columns";
import { uuidBinary } from "../types";

/**
 * A bank account is independent of dashboards: it is shared between users through `Bank_Account__User`
 * and its balance comes from the financial records of any dashboard paid with one of its cards.
 * The account has its own currency, which the balance is expressed in.
 */
export const bankAccount = mysqlTable("bank_account", {
    id: uuidBinary("bank_account_id").primaryKey(),
    name: t.varchar("name", { length: 50 }).notNull(),
    initialBalance: t.decimal("initial_balance", { precision: 10, scale: 2 }).notNull(),
    currencyId: uuidBinary("currency_id").notNull(),
    frozenAt: t.timestamp("frozen_at", { fsp: 3 }),
    ...softDelete,
    ...timestamps,
}, (table) => [
    t.foreignKey({
        name: "fk_bank_account_currency",
        columns: [table.currencyId],
        foreignColumns: [s.currency.id],
    }).onDelete("restrict"),

    t.index("idx_bank_account_currency_id").on(table.currencyId),
]);
