import { timestamp } from "drizzle-orm/mysql-core";

/**
 * Standard audit timestamp fields for tracking record lifecycle events.
 * These are typically mixed into table schemas to provide automatic
 * creation and update time tracking.
 */
export const timestamps = {
  /**
   * Record creation timestamp.
   * - Set automatically on INSERT to the current time
   * - Cannot be null (enforced at database level)
   * - Defaults to NOW() when no value is provided
   */
  createdAt: timestamp("created_at").notNull().defaultNow(),

  /**
   * Record update timestamp.
   * - Updates automatically on UPDATE operations via onUpdateNow()
   * - Cannot be null (enforced at database level)
   * - Defaults to NOW() on initial INSERT
   * Note: Requires MySQL trigger or application-layer hook for onUpdateNow() to function
   */
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
};

/**
 * Soft delete marker field.
 *
 * Implementation notes:
 * - Nullable (allows both active and deleted states)
 * - NULL indicates active record
 * - Non-NULL timestamp indicates deletion time
 * - Query filtering required in application layer (e.g., .where(isNull(softDelete.deletedAt)))
 * - Not enforced by database constraints
 */
export const softDelete = {
  /** Timestamp when record was logically deleted (NULL = active) */
  deletedAt: timestamp("deleted_at"),
};
