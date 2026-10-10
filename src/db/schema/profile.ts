import { mysqlTable, varchar, date, char, timestamp } from "drizzle-orm/mysql-core";
import { user } from "./user";

export const profile = mysqlTable("profile", {
    userId: varchar("user_id", { length: 36 }).primaryKey().references(() => user.id, { onDelete: "cascade" }),
    birthDate: date("birth_date"),
    phone: varchar("phone", { length: 20 }),
    phoneVerifiedAt: timestamp("phone_verified_at"),
    currency: char("currency", { length: 3 }).default("EUR"),
    language: varchar("language", { length: 254 }).default("pt-PT"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});

