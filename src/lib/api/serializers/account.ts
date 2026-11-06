import type { AccountRow } from "@/db/queries/me/accounts";
import { toIso } from "./common";

/** Linked account as returned by GET /me/accounts (endpoints.md, section 3.7). */
export function serializeAccount(row: AccountRow) {
  return {
    account_id: row.id,
    provider_id: row.providerId,
    scope: row.scope,
    access_token_expires_at: toIso(row.accessTokenExpiresAt),
    refresh_token_expires_at: toIso(row.refreshTokenExpiresAt),
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  };
}
