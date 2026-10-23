import { mysqlTable } from "drizzle-orm/mysql-core";
import * as t from "drizzle-orm/mysql-core";
import * as s from "./index";
import { timestamps } from "../columns";
import { uuidBinary } from "../types";

/**
 * OAuth Provider Account Credentials Table (Better Auth)
 * ... (comentários mantidos)
 */
export const account = mysqlTable("account", {

  /**
   * 🚨 CORRIGIDO: O Better Auth gera strings Base64 para o ID da conta.
   * Tem de ser varchar(255) para o MySQL aceitar.
   */
  id: t.varchar("account_id", { length: 255 }).primaryKey(),

  /**
   * ✅ MANTIDO: O foreign key para o User tem de continuar a ser UUID,
   * pois aponta para a tabela principal (que usa UUID).
   */
  userId: uuidBinary("user_id").notNull(),

  /**
   * Third-party provider's unique account identifier
   */
  accountId: t.text("account_identifier_id").notNull(),

  /**
   * OAuth provider identifier
   */
  providerId: t.text("provider_id").notNull(),

  /**
   * OAuth access token (short-lived)
   */
  accessToken: t.text("access_token"),

  /**
   * OAuth refresh token (long-lived)
   */
  refreshToken: t.text("refresh_token"),

  /**
   * Access token expiration timestamp (UTC)
   */
  accessTokenExpiresAt: t.timestamp("access_token_expires_at", { mode: "date", fsp: 3 }),

  /**
   * Refresh token expiration timestamp (UTC)
   */
  refreshTokenExpiresAt: t.timestamp("refresh_token_expires_at", { mode: "date", fsp: 3 }),

  /**
   * OAuth scope string
   */
  scope: t.text("scope"),

  /**
   * OpenID Connect ID token (JWT)
   */
  idToken: t.text("id_token"),

  /**
   * Password hash for traditional email/password authentication
   */
  password: t.text("password"),

  /**
   * Audit timestamp columns
   */
  ...timestamps,
}, (table) => [

  t.foreignKey({
    name: "fk_user_account_user",
    columns: [table.userId],
    foreignColumns: [s.user.id],
  }).onDelete("cascade"),

  /**
   * User association index for account queries
   */
  t.index("idx_account_user_id").on(table.userId),
]);