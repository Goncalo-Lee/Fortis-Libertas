import { and, asc, count, desc, eq, isNotNull, isNull, like } from "drizzle-orm";
import { db } from "@/db";
import { bankAccount, bankAccountUser, currency } from "@/db/schema";
import { escapeLike } from "@/db/utils";
import type { ListFiltersBankAccount } from "./type";

/* ======
  READ
======= */

const accountColumns = {
  id: bankAccount.id,
  name: bankAccount.name,
  initialBalance: bankAccount.initialBalance,
  currency: currency.code,
  frozenAt: bankAccount.frozenAt,
  role: bankAccountUser.role,
  createdAt: bankAccount.createdAt,
  updatedAt: bankAccount.updatedAt,
};

/** One bank account of the caller with their role, or `null` if missing, deleted or not a member. */
export async function getBankAccount(bankAccountId: string, userId: string) {
  const [row] = await db
    .select(accountColumns)
    .from(bankAccount)
    .innerJoin(bankAccountUser, eq(bankAccountUser.bankId, bankAccount.id))
    .innerJoin(currency, eq(currency.id, bankAccount.currencyId))
    .where(
      and(
        eq(bankAccount.id, bankAccountId),
        isNull(bankAccount.deletedAt),
        eq(bankAccountUser.userId, userId),
        isNull(bankAccountUser.deletedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Page of the caller's bank accounts and the total. `id` breaks sort ties. */
export async function listBankAccounts(userId: string, f: ListFiltersBankAccount) {
  const where = and(
    eq(bankAccountUser.userId, userId),
    isNull(bankAccountUser.deletedAt),
    isNull(bankAccount.deletedAt),
    f.q ? like(bankAccount.name, `%${escapeLike(f.q)}%`) : undefined,
    f.frozen === undefined ? undefined : f.frozen ? isNotNull(bankAccount.frozenAt) : isNull(bankAccount.frozenAt),
    f.role ? eq(bankAccountUser.role, f.role) : undefined,
  );

  const order = {
    name: asc(bankAccount.name),
    "-name": desc(bankAccount.name),
    created_at: asc(bankAccount.createdAt),
    "-created_at": desc(bankAccount.createdAt),
  }[f.sort as string] ?? asc(bankAccount.name);

  const rows = await db
    .select(accountColumns)
    .from(bankAccount)
    .innerJoin(bankAccountUser, eq(bankAccountUser.bankId, bankAccount.id))
    .innerJoin(currency, eq(currency.id, bankAccount.currencyId))
    .where(where)
    .orderBy(order, asc(bankAccount.id))
    .limit(f.limit)
    .offset(f.offset);

  const [totalRow] = await db
    .select({ total: count() })
    .from(bankAccount)
    .innerJoin(bankAccountUser, eq(bankAccountUser.bankId, bankAccount.id))
    .where(where);

  return { rows, total: totalRow?.total ?? 0 };
}

/** Active membership plus the (non-deleted) account, for `requireBankAccountRole`. */
export async function findBankAccountMembership(bankAccountId: string, userId: string) {
  const [row] = await db
    .select({ role: bankAccountUser.role, bankAccount })
    .from(bankAccountUser)
    .innerJoin(bankAccount, eq(bankAccount.id, bankAccountUser.bankId))
    .where(
      and(
        eq(bankAccountUser.bankId, bankAccountId),
        eq(bankAccountUser.userId, userId),
        isNull(bankAccountUser.deletedAt),
        isNull(bankAccount.deletedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}
