import { customType } from "drizzle-orm/mysql-core";
import { parse as uuidParse, stringify as uuidStringify, validate as uuidValidate } from "uuid";
import { v7 as uuid7 } from "uuid";


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
  return uuid7();
};



// Prefix MySQL uses for binary values inside JSON (JSON_OBJECT / JSON_ARRAYAGG), which is how
// Better Auth joins return ids. Kept while the joins may be used; with `joins: false` it is not produced.
const JSON_BINARY_PREFIX = "base64:type254:";

// 16 bytes -> "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx". Throws instead of returning a wrong id.
const bytesToUuid = (bytes: Uint8Array): string => {
  if (bytes.length !== 16) {
    throw new Error(`Invalid binary UUID: expected 16 bytes, got ${bytes.length}.`);
  }
  return uuidStringify(bytes);
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

  // A value that is not a UUID is a bug in the caller (routes validate ids with `parseUuid`), so it fails
  // loudly instead of being replaced by a zero UUID that would silently match or write the wrong row.
  toDriver(value: string): Buffer {
    if (typeof value === "string" && value.startsWith(JSON_BINARY_PREFIX)) {
      const bytes = Buffer.from(value.slice(JSON_BINARY_PREFIX.length), "base64");
      if (bytes.length !== 16) throw new Error(`Invalid binary UUID: expected 16 bytes, got ${bytes.length}.`);
      return bytes;
    }

    if (typeof value !== "string" || !uuidValidate(value)) {
      throw new Error(`Invalid UUID: ${JSON.stringify(value)}.`);
    }

    return Buffer.from(uuidParse(value));
  },

  // Same rule when reading: an unreadable value is an error, not an empty string.
  fromDriver(value: unknown): string {
    if (value instanceof Uint8Array) return bytesToUuid(value); // Buffer is a Uint8Array

    if (typeof value === "string") {
      if (value.startsWith(JSON_BINARY_PREFIX)) {
        return bytesToUuid(Buffer.from(value.slice(JSON_BINARY_PREFIX.length), "base64"));
      }
      if (uuidValidate(value)) return value.toLowerCase();
    }

    throw new Error(`Invalid UUID value from the database: ${JSON.stringify(value)}.`);
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

  toDriver(value: boolean | null | undefined): string | null {
    // Same format Drizzle uses for its own datetime columns (UTC)
    return value ? new Date().toISOString().replace("T", " ").replace("Z", "") : null;
  },

  fromDriver(value: unknown): boolean {
    return value !== null && value !== undefined;
  },
});
