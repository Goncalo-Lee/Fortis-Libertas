import { mysqlTable, text, timestamp } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import { dashboard } from "./dashboard";
import {uuidBinary} from "../types";

export const category = mysqlTable("category", {
    id: uuidBinary("category_id").primaryKey(),
    dashboardId: uuidBinary("dashboard_id").references(() => dashboard.id, { onDelete: "cascade" }),
    name: t.varchar("name", { length: 50 }),
    description: text("description"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});