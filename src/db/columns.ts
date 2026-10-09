import { customType } from "drizzle-orm/mysql-core";

/**
 * Configuration options for timestamp and datetime column types.
 *
 * @property {number} [fsp] Fractional seconds precision (0-6).
 *                          MySQL allows subsecond precision from 0 to 6 (e.g. 3 for milliseconds).
 * @property {"datetime" | "timestamp"} [mode] SQL date-time storage mode.
 *                                             Defaults to "datetime" in compliance with the data dictionary.
 */
export interface TimestampConfig {
  fsp?: number;
  mode?: "datetime" | "timestamp";
}

/**
 * Custom Drizzle MySQL column type for audit and lifecycle timestamps (`created_at`, `updated_at`).
 *
 * Adheres to the project Data Dictionary, where record timestamps are specified as `datetime`
 * (with optional fractional second precision `fsp`, typically 3 for millisecond accuracy).
 *
 * - **Database Type**: `datetime(fsp)` or `timestamp(fsp)` (e.g., `datetime(3)`)
 * - **Application Type**: JavaScript `Date`
 * - **Driver Type**: `Date | string`
 *
 * @example
 * ```ts
 * export const users = mysqlTable("user", {
 *   createdAt: timestamps("created_at", { fsp: 3 }).notNull(),
 *   updatedAt: timestamps("updated_at", { fsp: 3 }).notNull(),
 * });
 * ```
 */
export const timestamps = customType<{
  data: Date;
  driverData: Date | string;
  config: TimestampConfig;
}>({
  dataType(config) {
    const precision = typeof config?.fsp !== "undefined" ? `(${config.fsp})` : "";
    const typeName = config?.mode === "timestamp" ? "timestamp" : "datetime";
    return `${typeName}${precision}`;
  },

  toDriver(value: Date | string | null | undefined): Date | null {
    if (value === null || value === undefined) {
      return null;
    }
    return value instanceof Date ? value : new Date(value);
  },

  fromDriver(value: unknown): Date {
    if (value instanceof Date) {
      return value;
    }
    return new Date(value as string);
  },
});

/**
 * Custom Drizzle MySQL column type for soft-deletion timestamps (`deleted_at`).
 *
 * Represents whether an entity has been soft-deleted:
 * - Active records store `NULL` in the database, mapped to `null` in TypeScript.
 * - Soft-deleted records store the deletion timestamp (`datetime(fsp)`), mapped to `Date`.
 *
 * Corresponds to the `deleted_at: datetime NULL` specification in the Data Dictionary.
 *
 * - **Database Type**: `datetime(fsp)` (NULLable by default)
 * - **Application Type**: `Date | null`
 * - **Driver Type**: `Date | string | null`
 *
 * @example
 * ```ts
 * export const users = mysqlTable("user", {
 *   deletedAt: softDelete("deleted_at", { fsp: 3 }),
 * });
 * ```
 */
export const softDelete = customType<{
  data: Date | null;
  driverData: Date | string | null;
  config: TimestampConfig;
}>({
  dataType(config) {
    const precision = typeof config?.fsp !== "undefined" ? `(${config.fsp})` : "";
    const typeName = config?.mode === "timestamp" ? "timestamp" : "datetime";
    return `${typeName}${precision}`;
  },

  toDriver(value: Date | string | null | undefined): Date | null {
    if (value === null || value === undefined) {
      return null;
    }
    return value instanceof Date ? value : new Date(value);
  },

  fromDriver(value: unknown): Date | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (value instanceof Date) {
      return value;
    }
    return new Date(value as string);
  },
});
