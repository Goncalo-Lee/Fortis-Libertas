import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";

// Importa tudo (tabelas e relações) de uma só vez através do index do schema
import * as schema from "./schema";

const connectionUri = process.env.DATABASE_URL;

if (!connectionUri) {
  throw new Error("DATABASE_URL is not defined in the environment variables");
}

export const poolConnection = mysql.createPool(connectionUri);

export const db = drizzle({
  client: poolConnection as any,
  schema, // Passa o objeto limpo, sem precisar dos três pontos
  mode: "default"
});

export type Database = typeof db;