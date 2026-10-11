import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";
import { softDelete, timestamps } from "../columns";

export const paymentMethod = mysqlTable("payment_method", {
  id: uuidBinary("payment_method_id").primaryKey(),
  dashboardId: uuidBinary("dashboard_id").references(() => s.dashboard.id, { onDelete: "cascade" }).notNull(),
  cardId: uuidBinary("card_id").references(() => s.card.id, { onDelete: "set null" }),
  name: t.varchar("name", { length: 50 }).notNull(),
  description: t.text("description"),
  ...softDelete,
  ...timestamps,
}, (table) => [
  t.uniqueIndex("idx_payment_method_dashboard_name").on(table.dashboardId, table.name),
  t.index("idx_payment_method_dashboard_id").on(table.dashboardId),
  t.index("idx_payment_method_card_id").on(table.cardId),
]);
