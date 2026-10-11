import { mysqlTable, varchar, boolean } from "drizzle-orm/mysql-core";
import { uuidBinary } from "../types";
import { softDelete, timestamps } from "../columns";

export const dashboard = mysqlTable("dashboard", {
  id: uuidBinary("dashboard_id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...softDelete,
  ...timestamps,
});
