import { activityLog } from "@/db/schema";
import { generateId } from "@/db/types";
import { getRequestContext } from "@/lib/api/request-context";
import type { Executor } from "../notifications/type";

/* =======
  WRITE
======== */

/**
 * Where an event happened. The scope decides which id is set (enforced by `chk_activity_log_scope`):
 * - `dashboard`    -> `dashboardId`
 * - `bank_account` -> `bankAccountId`
 * - `account`      -> none (the user's own account: sign-in, password, profile...)
 */
type Target =
  | { scope: "dashboard"; dashboardId: string }
  | { scope: "bank_account"; bankAccountId: string }
  | { scope: "account" };

export type ActivityEntry = Target & {
  /** What kind of thing changed: `financial_record`, `category`, `member`, `session`... */
  entityType: string;
  entityId?: string | null;
  /** What happened: `created`, `updated`, `deleted`, `restored`, `member_added`, `sign_in`... */
  action: string;
  /**
   * Context for a human reading the log: e.g. `{ name }`, or `{ fields: [...] }` on updates.
   * NEVER secrets, tokens, passwords or card numbers. Only field NAMES on updates, not their values.
   */
  metadata?: Record<string, unknown> | null;
  /** Who did it. Defaults to the authenticated user of the current request. */
  userId?: string;
};

/**
 * Writes an activity log entry (endpoints.md, section 19).
 *
 * Always pass the `tx` of the change being logged: if the change rolls back, the entry rolls back with it,
 * so the log never shows an action that did not happen.
 *
 * The user, IP and user agent come from the request context (see `lib/api/request-context.ts`).
 *
 * @throws Error when no user is known: that is a bug (a write outside an authenticated request), not a client error.
 */
export async function logActivity(executor: Executor, entry: ActivityEntry) {
  const context = getRequestContext();
  const userId = entry.userId ?? context?.userId;
  if (!userId) throw new Error(`logActivity(${entry.entityType}.${entry.action}) called without a known user.`);

  await executor.insert(activityLog).values({
    id: generateId(),
    userId,
    scope: entry.scope,
    dashboardId: entry.scope === "dashboard" ? entry.dashboardId : null,
    bankAccountId: entry.scope === "bank_account" ? entry.bankAccountId : null,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    action: entry.action,
    metadata: entry.metadata ?? null,
    ipAddress: context?.ipAddress ?? null,
    userAgent: context?.userAgent ?? null,
  });
}

/** Shortcut for the most common case: an event inside a dashboard. */
export function logDashboardActivity(
  executor: Executor,
  dashboardId: string,
  entry: Omit<ActivityEntry, "scope" | "dashboardId" | "bankAccountId">,
) {
  return logActivity(executor, { ...entry, scope: "dashboard", dashboardId } as ActivityEntry);
}

/**
 * Names of the changed fields, for `metadata.fields`, in the API's snake_case (`colorId` -> `color_id`).
 * Pass the `set` object of the UPDATE, so only the fields that really changed are listed.
 */
export function changedFields(set: object) {
  return Object.entries(set)
    .filter(([key, value]) => value !== undefined && key !== "updatedAt")
    .map(([key]) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`));
}
