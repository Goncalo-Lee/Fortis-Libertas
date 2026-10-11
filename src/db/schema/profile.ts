import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { timestamps } from "../columns";
import { uuidBinary } from "../types";

export const profile = mysqlTable("profile", {
    userId: uuidBinary("user_id").primaryKey().references(() => s.user.id, { onDelete: "cascade" }),
    birthDate: t.date("birth_date"),
    phone: t.varchar("phone", { length: 20 }),
    phoneVerifiedAt: t.timestamp("phone_verified_at", { fsp: 3 }),
    currency: t.char("currency", { length: 3 }).default("EUR"),
    language: t.varchar("language", { length: 254 }).default("pt-PT"),
    ...timestamps,
});
