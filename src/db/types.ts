import { customType } from "drizzle-orm/mysql-core";
import { v7 as uuidv7, parse as uuidParse, stringify as uuidStringify } from "uuid";

/**
 * Generates a time-ordered UUID version 7 (UUIDv7) string.
 *
 * Employs Bun's high-performance native `Bun.randomUUIDv7()` when running within
 * a Bun runtime, falling back transparently to the standard `uuid` package's `v7()`
 * generator when executing in Node.js, Next.js builds, or database migration CLIs.
 *
 * @returns {string} Standard 36-character hyphenated UUIDv7 string.
 * @example
 * ```ts
 * const id = generateId(); // "018d3e26-785c-7b24-b19b-648cf4be3c16"
 * ```
 */
export const generateId = (): string => {
  if (typeof Bun !== "undefined" && typeof Bun.randomUUIDv7 === "function") {
    return Bun.randomUUIDv7();
  }
  return uuidv7();
};

/**
 * Custom Drizzle MySQL column type for 16-byte binary UUIDs (`binary(16)`).
 *
 * As specified in the project Data Dictionary, primary and foreign keys are stored
 * in MySQL as compact 16-byte binary buffers (`binary(16)`) for optimal index locality
 * and reduced memory footprint, while being transparently handled as formatted
 * 36-character UUIDv7 strings within application code.
 *
 * - **Database Type**: `binary(16)`
 * - **Application Type**: `string` (UUID v7 format)
 * - **Driver Type**: `Buffer`
 *
 * @example
 * ```ts
 * export const users = mysqlTable("user", {
 *   id: uuidBinary("id").primaryKey(),
 * });
 * ```
 */
export const uuidBinary = customType<{
  data: string;
  driverData: Buffer;
}>({
  dataType() {
    return "binary(16)";
  },

  toDriver(value: string): Buffer {
    return Buffer.from(uuidParse(value));
  },

  fromDriver(value: unknown): string {
    if (typeof value === "string") {
      return value;
    }
    return uuidStringify(value as Uint8Array);
  },
});

/**
 * Custom Drizzle MySQL column type that maps a boolean state to a high-precision `datetime(3)`.
 *
 * Designed for columns representing state transitions where persistence records the timestamp
 * when true (e.g., email verification or account action timestamps), while exposing an intuitive
 * `boolean` to the TypeScript application code.
 *
 * - **Database Type**: `datetime(3)` (stores `NULL` when false, current timestamp when true)
 * - **Application Type**: `boolean`
 * - **Driver Type**: `Date | string | null`
 *
 * @example
 * ```ts
 * export const users = mysqlTable("user", {
 *   emailVerified: booleanAsDatetime("email_verified_at"),
 * });
 * ```
 */
export const booleanAsDatetime = customType<{
  data: boolean;
  driverData: Date | string | null;
}>({
  dataType() {
    return "datetime(3)";
  },

  toDriver(value: boolean | null | undefined): Date | null {
    return value ? new Date() : null;
  },

  fromDriver(value: unknown): boolean {
    return value !== null && value !== undefined;
  },
});
