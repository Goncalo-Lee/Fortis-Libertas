import { mysqlTable, char, varchar, text, timestamp } from "drizzle-orm/mysql-core";
import { dashboard } from "./dashboard";
import { card } from "./card";

export const paymentMethod = mysqlTable("payment_method", {
    id: char("payment_method_id", { length: 26 }).primaryKey(),
    dashboardId: varchar("dashboard_id", { length: 36 }).references(() => dashboard.id, { onDelete: "cascade" }),
    cardId: varchar("card_id", { length: 36 }).references(() => card.id, { onDelete: "set null" }),
    name: varchar("name", { length: 50 }),
    description: text("description"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});