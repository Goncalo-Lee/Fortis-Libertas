/**
 * Number of days a soft-deleted dashboard remains recoverable.
 *
 * After this window expires, the dashboard is considered permanently deleted
 * and should be purged by a background job (or left as-is if permanent deletion
 * isn't implemented yet).
 *
 * Referenced in: endpoints.md, section 1.5.
 *
 * Usage:
 * const isRestorable = (dashboard.deletedAt ?? 0) > Date.now() - (DASHBOARD_RESTORE_WINDOW_DAYS * DAY_MS);
 */
export const DASHBOARD_RESTORE_WINDOW_DAYS = 30;

/**
 * Milliseconds in a standard 24-hour day.
 *
 * Used to convert `DASHBOARD_RESTORE_WINDOW_DAYS` into a time delta for
 * comparisons against `Date.now()` or `deletedAt` timestamps.
 *
 * Note: This assumes a fixed 24h day. For high-precision astronomical calculations
 * involving leap seconds, this would be insufficient, but it's perfectly adequate
 * for business logic like retention windows.
 */
export const DAY_MS = 24 * 60 * 60 * 1000;
