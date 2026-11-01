import type { MySqlColumn, MySqlTable } from "drizzle-orm/mysql-core";
import { db } from "../..";
import { bankAccountUser, userDashboard } from "../../schema";
import type { Role } from "../type";

/* ===========
  MEMBERSHIPS
============ */

/*
 * Dashboards (`User__Dashboard`) and bank accounts (`Bank_Account__User`) have the same membership model:
 * a (scope, user) primary key, a role (owner/editor/viewer) and a soft delete. Their rules are the same too:
 * the scope always keeps one owner, removing a member is a soft delete, and adding a removed member
 * reactivates the row. This file holds that shared logic; `dashboard-members/` and `bank-account-members/`
 * are thin wrappers that pick the table and add what is specific to each (for example, the cards check).
 */

export type { Role };

/** Transaction handle received by `db.transaction`. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Member of a scope with the user data joined (what the API serializes). */
export type MemberRow = {
  userId: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  userName: string | null;
  fullName: string;
  image: string | null;
};

// The columns every membership table has.
type MembershipTable = MySqlTable & {
  userId: MySqlColumn;
  role: MySqlColumn;
  deletedAt: MySqlColumn;
  createdAt: MySqlColumn;
  updatedAt: MySqlColumn;
};

/** Describes one membership: its table and the column holding the scope id (dashboard or bank account). */
export interface Membership {
  table: MembershipTable;
  scopeId: MySqlColumn;
  /** Property name of the scope column in the table (used to insert a new row). */
  scopeKey: "dashboardId" | "bankId";
}

export const dashboardMembership: Membership = {
  table: userDashboard,
  scopeId: userDashboard.dashboardId,
  scopeKey: "dashboardId",
};

export const bankAccountMembership: Membership = {
  table: bankAccountUser,
  scopeId: bankAccountUser.bankId,
  scopeKey: "bankId",
};
