import { mysqlTable, varchar, json, timestamp } from "drizzle-orm/mysql-core";
import { user } from "./user";

export const notifications = mysqlTable("notifications", {
    id: varchar("notification_id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).references(() => user.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }),
    data: json("data"),
    createdAt: timestamp("created_at").defaultNow(),
    readAt: timestamp("read_at"),
});