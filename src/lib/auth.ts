import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { db } from "../db";
import * as schema from "../db/schema";
import { generateId } from "../db/types";

/**
 * Better Auth Configuration
 *
 * Centralized authentication service utilizing Better Auth with:
 * - Drizzle ORM MySQL adapter for database operations.
 * - Custom UUIDv7 ID generator ensuring entity primary keys match the project's
 *   `binary(16)` / UUIDv7 architecture defined in the Data Dictionary.
 * - Two-Factor Authentication (`twoFactor`) plugin for multi-factor security.
 *
 * Environment Requirements:
 * - `BETTER_AUTH_SECRET`: Secret key for session/token cryptographic operations.
 * - `BETTER_AUTH_URL`: Canonical base URL of the application.
 * - `DATABASE_URL`: Connection string for the MySQL database.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: {
      ...schema,
    },
  }),
  advanced: {
    database: {
      // Enforces application-wide UUIDv7 generation for all Better Auth models
      generateId: () => generateId(),
    },
  },
  plugins: [
    twoFactor(),
  ],
});

export type Auth = typeof auth;
