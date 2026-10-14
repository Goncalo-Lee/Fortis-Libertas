import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import {betterAuth} from "better-auth";
import {bearer, twoFactor, username} from "better-auth/plugins";
import { db } from "../db";
import * as schema from "../db/schema";
import { generateId } from "../db/types";
import {nextCookies} from "better-auth/next-js";

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
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      twoFactor: schema.twoFactor,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 32,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  advanced: {
    database: {
      // Enforces application-wide UUIDv7 generation for all Better Auth models
      generateId: () => generateId(),
      joins: true,
    },
  },
  appName: "FortisLibertas",
  plugins: [
    twoFactor(),
    bearer(),
    nextCookies(),
  ],
});

export type Auth = typeof auth;
