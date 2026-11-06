import type { BankAccountRow } from "@/db/queries/bank-accounts";
import { toIso } from "./common";

/**
 * Serializes a bank account. `balance` is derived (see `getBankAccountBalances`), in the account currency.
 */
export function serializeBankAccount(row: BankAccountRow, balance: string) {
  return {
    bank_account_id: row.id,
    name: row.name,
    initial_balance: String(row.initialBalance),
    balance,
    currency: row.currency,
    frozen_at: toIso(row.frozenAt),
    role: row.role,
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  };
}
