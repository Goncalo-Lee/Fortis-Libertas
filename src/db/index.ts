import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";

/**
 * MySQL Connection URL
 *
 * Sourced from the DATABASE_URL environment variable.
 * Expected format: mysql://<user>:<password>@<host>:<port>/<database>
 */
const connectionUri = process.env.DATABASE_URL;

if (!connectionUri) {
  throw new Error("DATABASE_URL is not defined in the environment variables");
}

/**
 * Shared MySQL Connection Pool.
 *
 * Utilizes connection pooling to manage concurrent queries efficiently
 * across API requests and server-side operations.
 */
export const poolConnection = mysql.createPool(connectionUri);

/**
 * Drizzle ORM database instance configured with MySQL2 driver and relational schema.
 */
export const db = drizzle({ client: poolConnection });

export type Database = typeof db;
