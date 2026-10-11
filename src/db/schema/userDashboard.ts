import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";
import { softDelete, timestamps } from "../columns";

export const userDashboard = mysqlTable("user__dashboard", {
  dashboardId: uuidBinary("dashboard_id").references(() => s.dashboard.id, { onDelete: "cascade" }).notNull(),
  userId: uuidBinary("user_id").references(() => s.user.id, { onDelete: "cascade" }).notNull(),
  role: t.mysqlEnum("role", ["owner", "editor", "viewer"]).notNull(),
  ...softDelete,
  ...timestamps
}, (table) => [
  t.primaryKey({ columns: [table.dashboardId, table.userId] }),
  t.index("idx_user_dashboard_user_id").on(table.userId),
]);
