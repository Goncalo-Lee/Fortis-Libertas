import { sql } from "drizzle-orm";
import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";

/**
 * Append-only audit trail (who did what). Written by the server only; never updated or deleted,
 * so it has no `updated_at` / `deleted_at`.
 */
export const activityLog = mysqlTable("activity_log", {
    id: uuidBinary("activity_log_id").primaryKey(),
    userId: uuidBinary("user_id").notNull(),
    scope: t.mysqlEnum("scope", ["account", "dashboard", "bank_account"]).notNull(),
    dashboardId: uuidBinary("dashboard_id"),
    bankAccountId: uuidBinary("bank_account_id"),
    entityType: t.varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuidBinary("entity_id"),
    action: t.varchar("action", { length: 50 }).notNull(),
    metadata: t.json("metadata"),
    ipAddress: t.varchar("ip_address", { length: 45 }),
    userAgent: t.text("user_agent"),
    createdAt: t.timestamp("created_at", { fsp: 3 }).notNull().defaultNow(),
}, (table) => [
    t.foreignKey({
        name: "fk_activity_log_user",
        columns: [table.userId],
        foreignColumns: [s.user.id],
    }).onDelete("restrict"),

    t.foreignKey({
        name: "fk_activity_log_dashboard",
        columns: [table.dashboardId],
        foreignColumns: [s.dashboard.id],
    }).onDelete("cascade"),

    t.foreignKey({
        name: "fk_activity_log_bank_account",
        columns: [table.bankAccountId],
        foreignColumns: [s.bankAccount.id],
    }).onDelete("cascade"),

    // The scope decides which target is set (account: none; dashboard: dashboard only; bank_account: bank account only).
    t.check(
        "chk_activity_log_scope",
        sql`(${table.scope} = 'account' and ${table.dashboardId} is null and ${table.bankAccountId} is null)
            or (${table.scope} = 'dashboard' and ${table.dashboardId} is not null and ${table.bankAccountId} is null)
            or (${table.scope} = 'bank_account' and ${table.bankAccountId} is not null and ${table.dashboardId} is null)`,
    ),

    t.index("idx_activity_log_dashboard_created").on(table.dashboardId, table.createdAt),
    t.index("idx_activity_log_bank_account_created").on(table.bankAccountId, table.createdAt),
    t.index("idx_activity_log_user_created").on(table.userId, table.createdAt),
]);
