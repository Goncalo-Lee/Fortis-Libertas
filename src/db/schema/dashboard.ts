import { mysqlTable, varchar, boolean, timestamp } from "drizzle-orm/mysql-core";

export const dashboard = mysqlTable("dashboard", {
    id: varchar("dashboard_id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 50 }),
    isActive: boolean("is_active"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});