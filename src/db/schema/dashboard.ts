import { mysqlTable, boolean, timestamp } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import {uuidBinary} from "../types";

export const dashboard = mysqlTable("dashboard", {
    id: uuidBinary("dashboard_id").primaryKey(),
    name: t.varchar("name", { length: 50 }),
    isActive: boolean("is_active"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});