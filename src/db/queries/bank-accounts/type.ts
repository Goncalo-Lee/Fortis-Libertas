import type { ListFilters, Role } from "../type";
import type { getBankAccount } from "./read";

/* ======
  TYPE
======= */

/** Bank account of the caller, with their role and the currency code. */
export type BankAccountRow = NonNullable<Awaited<ReturnType<typeof getBankAccount>>>;

/** Filters of `listBankAccounts`: the common list filters plus the bank account ones. */
export type ListFiltersBankAccount = ListFilters & {
  /** `true` keeps frozen accounts, `false` keeps the others */
  frozen?: boolean;
  /** Only accounts where the caller has this role */
  role?: Role;
};

export interface CreateBankAccountInput {
  name: string;
  /** Decimal string, e.g. "1500.00" */
  initialBalance: string;
  /** Currency code; defaults to the caller's profile currency */
  currency?: string;
}

export interface UpdateBankAccountInput {
  name?: string;
  initialBalance?: string;
}
