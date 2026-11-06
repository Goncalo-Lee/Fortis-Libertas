import * as memberships from "../memberships";

/* ======
  READ
======= */

/** One active member of a bank account with the user data joined, or `null`. */
export const getBankAccountMember = (bankAccountId: string, userId: string) =>
  memberships.getMember(memberships.bankAccountMembership, bankAccountId, userId);

/**
 * Lists the active members of a bank account (up to 500; accounts have few members).
 * `callerUserId` is kept for the current routes and is not used.
 */
export async function listBankAccountMembers(bankAccountId: string, callerUserId?: string) {
  const { rows } = await memberships.listMembers(memberships.bankAccountMembership, bankAccountId, 500, 0);
  return rows;
}
