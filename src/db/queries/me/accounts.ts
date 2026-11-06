import { asc, eq } from "drizzle-orm";
import { db } from "../..";
import { account } from "../../schema";

/* ======
  LINKED ACCOUNTS
======= */

/**
 * Sign-in methods linked to a user (Better Auth's `account` table): `credential` for email + password,
 * `google` for "Sign in with Google", and so on. Oldest first, so the original sign-up method comes first.
 *
 * Only metadata is selected. `access_token`, `refresh_token`, `id_token` and `password` are secrets:
 * they are left out of the query itself, so they cannot leak through a serializer mistake.
 */
export async function listAccounts(userId: string) {
  return db
    .select({
      id: account.id,
      providerId: account.providerId,
      scope: account.scope,
      accessTokenExpiresAt: account.accessTokenExpiresAt,
      refreshTokenExpiresAt: account.refreshTokenExpiresAt,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    })
    .from(account)
    .where(eq(account.userId, userId))
    .orderBy(asc(account.createdAt));
}

export type AccountRow = Awaited<ReturnType<typeof listAccounts>>[number];
