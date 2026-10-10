import { mysqlTable, varchar, text, timestamp } from "drizzle-orm/mysql-core";
import { dashboard } from "./dashboard";

export const tag = mysqlTable("tag", {
    id: varchar("tag_id", { length: 36 }).primaryKey(),
    dashboardId: varchar("dashboard_id", { length: 36 }).references(() => dashboard.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 50 }),
    description: text("description"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});