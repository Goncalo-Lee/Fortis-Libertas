import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { uuidBinary } from "../types";
import {timestamps} from "@/db/columns";

/**
 * Session table for Better Auth session management
 * ... (comentários mantidos)
 */
export const session = mysqlTable("session", {

  /**
   * 🚨 CORRIGIDO: O ID da sessão gerado pelo Better Auth é uma string Base64.
   * Tem de ser varchar(255) para o MySQL aceitar.
   */
  id: uuidBinary("session_id").primaryKey(),

  /**
   * ✅ MANTIDO: Foreign key para a tabela user, mantém-se UUID.
   */
  userId: uuidBinary("user_id").notNull(),

  /**
   * ✅ MANTIDO: O Token já tinhas corrigido muito bem para varchar!
   */
  token: t.varchar("token", { length: 255 })
      .notNull()
      .unique(),

  /**
   * Session expiration timestamp (UTC)
   */
  expiresAt: t.timestamp("expires_at", { mode: "date", fsp: 3 })
      .notNull(),

  /**
   * Client IP address at session creation
   */
  ipAddress: t.text("ip_address"),

  /**
   * Client User-Agent header
   */
  userAgent: t.text("user_agent"),

  /**
   * Audit timestamp columns
   */
  ...timestamps,
}, (table) => [

  t.foreignKey({
    name: "fk_user_session_user",
    columns: [table.userId],
    foreignColumns: [s.user.id],
  }).onDelete("cascade"),

  /**
   * Composite index for session queries by user
   */
  t.index("session_userId_idx").on(table.userId),
]);