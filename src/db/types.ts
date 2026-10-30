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
    // 1. THE SAFETY NET: Prevents the app from crashing on bad data
    if (typeof value === "string" && value.startsWith("base64:type254:")) {
      const base64Part = value.substring("base64:type254:".length);
      return Buffer.from(base64Part, "base64");
    }

    if (!uuidValidate(value)) {
      console.warn(`[WARNING] Invalid UUID received: "${value}". Falling back to zero-UUID.`);
      return Buffer.from(uuidParse("00000000-0000-0000-0000-000000000000"));
    }

    // 2. THE HAPPY PATH: Wraps the Uint8Array securely in a Buffer
    return Buffer.from(uuidParse(value));
  },

  fromDriver(value: unknown): string {
    if (!value) {
      return "";
    }

    // Se o MySQL nos devolver um Buffer, lemos os bytes diretamente
    // para uma string hexadecimal e formatamos com hífens manualmente,
    // garantindo 0 crashes!
    if (Buffer.isBuffer(value)) {
      if (value.length === 16) {
        const hex = value.toString("hex");
        // Formata: 8-4-4-4-12
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
      }
      return "";
    }

    if (typeof value === "string") {
      if (value.startsWith("base64:type254:")) {
        const base64Part = value.substring("base64:type254:".length);
        const buf = Buffer.from(base64Part, "base64");
        if (buf.length === 16) {
          const hex = buf.toString("hex");
          return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
        }
        return "";
      }

      if (uuidValidate(value)) {
        return value;
      }
      return "";
    }

    try {
      const arr = value as Uint8Array;
      if (arr.length === 16) {
        const hex = Buffer.from(arr).toString("hex");
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
      }
    } catch (e) {
      // Ignora
    }

    return "";
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
