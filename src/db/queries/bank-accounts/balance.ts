import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { card, currency, financialRecord, paymentMethod, recordType } from "@/db/schema";
import { addDecimal } from "@/lib/exchange/decimal";
import { convertAmount, todayUtc } from "@/lib/exchange";
import type { BankAccountRow } from "./type";

/* ========
  BALANCE
========= */

/**
 * Balance of each account, as decimal strings in the currency of the account: `initial_balance` plus the effect
 * of the non-deleted records with status `paid` or `settled` whose payment method points to a card of the
 * account, from any dashboard (records of a soft-deleted dashboard keep counting).
 *
 * `Record_Type.kind` decides the sign (`income` adds, `expense` subtracts, `neutral` is ignored). Amounts in other
 * currencies are converted with the rate of the payment day (the latest rate for a day still ahead). A group of
 * records whose rate is not available is left out of the balance rather than failing the request.
 *
 * Records are summed in SQL per (account, currency, kind, day), so only one conversion per group is needed.
 *
 * @returns Balance by account id (lowercase)
 */
export async function getBankAccountBalances(accounts: Pick<BankAccountRow, "id" | "currency" | "initialBalance">[]) {
  const balances = new Map<string, string>();
  if (accounts.length === 0) return balances;

  for (const a of accounts) balances.set(a.id.toLowerCase(), String(a.initialBalance));
  const accountCurrency = new Map(accounts.map((a) => [a.id.toLowerCase(), a.currency]));

  const day = sql<string>`DATE_FORMAT(${financialRecord.paymentDate}, '%Y-%m-%d')`;
  const rows = await db
    .select({
      bankAccountId: card.bankId,
      currency: currency.code,
      kind: recordType.kind,
      day,
      total: sql<string>`SUM(${financialRecord.price})`,
    })
    .from(financialRecord)
    .innerJoin(recordType, eq(recordType.id, financialRecord.recordTypeId))
    .innerJoin(paymentMethod, eq(paymentMethod.id, financialRecord.paymentMethodId))
    .innerJoin(card, eq(card.id, paymentMethod.cardId))
    .innerJoin(currency, eq(currency.id, financialRecord.currencyId))
    .where(
      and(
        inArray(card.bankId, accounts.map((a) => a.id)),
        isNull(financialRecord.deletedAt),
        inArray(financialRecord.status, ["paid", "settled"]),
        ne(recordType.kind, "neutral"),
      ),
    )
    .groupBy(card.bankId, currency.code, recordType.kind, day);

  const today = todayUtc();
  for (const row of rows) {
    const id = row.bankAccountId.toLowerCase();
    const target = accountCurrency.get(id);
    if (!target) continue;

    let amount: string | null = String(row.total);
    if (row.currency !== target) {
      const converted = await convertAmount(amount, row.currency, target, row.day >= today ? "current" : row.day);
      amount = converted?.amount ?? null;
    }
    if (amount === null) continue;

    const signed = row.kind === "expense" ? addDecimal("0", `-${amount.replace(/^-/, "")}`) : amount;
    balances.set(id, addDecimal(balances.get(id) ?? "0", signed));
  }

  return balances;
}
