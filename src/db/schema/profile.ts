import { mysqlTable, date, char, timestamp, varchar, foreignKey } from "drizzle-orm/mysql-core";
import { user } from "./user";
import { uuidBinary } from "../types";

export const profile = mysqlTable(
    "profile",
    {
        // 1. Nova Chave Primária independente para cada perfil criado
        id: uuidBinary("id").primaryKey(),

        // 2. O userId perde o .primaryKey() e o .unique(), passando a ser apenas uma referência não nula
        userId: uuidBinary("user_id").notNull(),

        birthDate: date("birth_date"),
        phone: varchar("phone", { length: 20 }),
        phoneVerifiedAt: timestamp("phone_verified_at"),
        currency: char("currency", { length: 3 }).default("EUR"),
        language: varchar("language", { length: 254 }).default("pt-PT"),
        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at").onUpdateNow(),
    },
    (table) => ({
        // 3. A chave estrangeira com on cascade mantém-se para ligar ao utilizador
        userFk: foreignKey({
            name: "fk_profile_user",
            columns: [table.userId],
            foreignColumns: [user.id],
        }).onDelete("cascade"),
    })
);