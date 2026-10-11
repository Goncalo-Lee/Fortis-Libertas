import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";

export const notifications = mysqlTable("notifications", {
    id: uuidBinary("notification_id").primaryKey(),
    userId: uuidBinary("user_id"),
    type: t.varchar("type", { length: 255 }).notNull(),
    data: t.json("data").notNull(),
    createdAt: t.timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    readAt: t.timestamp("read_at"),
}, (table) => [
    t.foreignKey({
        name: "fk_notifications_user",
        columns: [table.userId],
        foreignColumns: [s.user.id],
    }).onDelete("cascade"),

    t.index("idx_notifications_user_id").on(table.userId),
    t.index("idx_notifications_read_at").on(table.readAt),
]);
