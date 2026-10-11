import { mysqlTable, json, timestamp } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import { user } from "./user";
import {uuidBinary} from "../types";



export const notifications = mysqlTable("notifications", {
    id: uuidBinary("notification_id").primaryKey(),
    userId: uuidBinary("user_id").references(() => user.id, { onDelete: "cascade" }),
    type: t.varchar("type", { length: 255 }),
    data: json("data"),
    createdAt: timestamp("created_at").defaultNow(),
    readAt: timestamp("read_at"),
});