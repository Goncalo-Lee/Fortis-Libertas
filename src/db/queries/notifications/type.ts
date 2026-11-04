import type { db } from "../..";
import type { Tx } from "../memberships";

/**
 * Notification types created by the server (endpoints.md, section 4: there is no public POST).
 * `data` is what a client needs to show and link the notification, without another request when possible.
 *
 * - `dashboard.member_added`    -> { dashboard_id, role, added_by }
 * - `bank_account.member_added` -> { bank_account_id, role, added_by }
 */
export type NotificationType = "dashboard.member_added" | "bank_account.member_added";

/** Either the plain connection or an open transaction, so a notification can be written with the change that caused it. */
export type Executor = typeof db | Tx;

export type ListNotificationsFilters = {
  unread?: boolean;
  type?: string;
  sort: "created_at" | "-created_at";
  limit: number;
  offset: number;
};
