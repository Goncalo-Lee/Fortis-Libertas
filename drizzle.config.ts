/**
 * Drizzle Kit Configuration for Database Migrations
 *
 * This file configures Drizzle Kit, the CLI tool used for managing database
 * migrations and schema synchronization in Drizzle ORM projects.
 *
 * Environment Requirements:
 * - DATABASE_URL: Must be set in .env file (MySQL connection string)
 *   Format: mysql://user:password@host:port/database_name
 *
 * Migration Output:
 * - SQL files generated in ./drizzle/ directory
 *
 * Schema Location:
 * - TypeScript schema definition at ./src/db/schema/index.ts
 *
 * Database Dialect:
 * - Configured for MySQL/MariaDB databases
 *
 * Security Note:
 * - Throws error if DATABASE_URL is undefined, preventing misconfiguration
 */
import { defineConfig } from 'drizzle-kit';


if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema/index.ts',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
