/**
 * Partial payload accepted when updating a user's profile.
 *
 * Keys use snake_case to match the Zod request schema. They are mapped to
 * camelCase database columns inside `updateProfile`.
 */
export type ProfileChanges = {
  birth_date?: string | null;
  phone?: string | null;
  currency?: string;
  language?: string;
  /** Must be a bank account the user belongs to; `null` clears it */
  primary_bank_account_id?: string | null;
};
