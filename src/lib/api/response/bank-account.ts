import { getBankAccountBalances, type BankAccountRow } from "@/db/queries/bank-accounts";
import { serializeBankAccount } from "../serializers/bank-account";

/** Serializes bank accounts with their derived `balance` (one query for all of them). */
export async function presentBankAccounts(rows: BankAccountRow[]) {
  const balances = await getBankAccountBalances(rows);
  return rows.map((row) => serializeBankAccount(row, balances.get(row.id.toLowerCase()) ?? String(row.initialBalance)));
}

export async function presentBankAccount(row: BankAccountRow) {
  const [data] = await presentBankAccounts([row]);
  return data;
}
