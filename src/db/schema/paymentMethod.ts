import { mysqlTable, text, timestamp } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import { dashboard } from "./dashboard";
import { card } from "./card";
import {uuidBinary} from "../types";

export const paymentMethod = mysqlTable("payment_method", {
    id: uuidBinary("payment_method_id").primaryKey(),
    dashboardId: uuidBinary("dashboard_id").references(() => dashboard.id, { onDelete: "cascade" }),
    cardId: uuidBinary("card_id").references(() => card.id, { onDelete: "set null" }),
    name: t.varchar("name", { length: 50 }),
    description: text("description"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
});