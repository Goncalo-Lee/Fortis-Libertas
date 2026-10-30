import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { timestamps } from "../columns";
import { uuidBinary } from "../types";

export const profile = mysqlTable("profile", {
    userId: uuidBinary("user_id").primaryKey(),
    birthDate: t.date("birth_date"),
    phone: t.varchar("phone", { length: 20 }),
    phoneVerifiedAt: t.timestamp("phone_verified_at", { fsp: 3 }),
    currencyId: uuidBinary("currency_id").notNull(),
    languageId: uuidBinary("language_id").notNull(),
    ...timestamps,
}, (table) => [
    t.foreignKey({
        name: "fk_profile_user",
        columns: [table.userId],
        foreignColumns: [s.user.id],
    }).onDelete("cascade"),

    t.foreignKey({
        name: "fk_profile_currency",
        columns: [table.currencyId],
        foreignColumns: [s.currency.id],
    }).onDelete("restrict"),

    t.foreignKey({
        name: "fk_profile_language",
        columns: [table.languageId],
        foreignColumns: [s.language.id],
    }).onDelete("restrict"),

    t.index("idx_profile_currency_id").on(table.currencyId),
    t.index("idx_profile_language_id").on(table.languageId),
]);
