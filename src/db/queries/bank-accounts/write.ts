import { changedFields, logBankAccountActivity } from "../activity-logs/write";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { bankAccount, bankAccountUser, card } from "@/db/schema";
import { generateId } from "@/db/types";
import { ApiError } from "@/lib/api/errors";
import { DEFAULT_CURRENCY, requireCurrencyId } from "../catalogs";
import { getOrCreateProfile } from "../me/read";
import { getBankAccount } from "./read";
import type { CreateBankAccountInput, UpdateBankAccountInput } from "./type";

/* ======
  WRITE
======= */

/** Creates an account and its owner membership in one transaction. Currency defaults to the profile's and is immutable. */
export async function createBankAccount(userId: string, input: CreateBankAccountInput) {
  const code = input.currency ?? (await getOrCreateProfile(userId)).currency ?? DEFAULT_CURRENCY;
  const currencyId = await requireCurrencyId(code);
  const id = generateId();

  await db.transaction(async (tx) => {
    await tx.insert(bankAccount).values({ id, name: input.name, initialBalance: input.initialBalance, currencyId });
    await tx.insert(bankAccountUser).values({ bankId: id, userId, role: "owner" });
    await logBankAccountActivity(tx, id, {
      userId, entityType: "bank_account", entityId: id, action: "created", metadata: { name: input.name },
    });
  });

  return getBankAccount(id, userId);
}

export async function updateBankAccount(bankAccountId: string, userId: string, input: UpdateBankAccountInput) {
  const set: Partial<typeof bankAccount.$inferInsert> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.initialBalance !== undefined) set.initialBalance = input.initialBalance;

  if (Object.keys(set).length > 0) {
    await db.transaction(async (tx) => {
      const [result] = await tx
        .update(bankAccount)
        .set({ ...set, updatedAt: new Date() })
        .where(and(eq(bankAccount.id, bankAccountId), isNull(bankAccount.deletedAt)));

      if (result.affectedRows > 0) {
        await logBankAccountActivity(tx, bankAccountId, {
          entityType: "bank_account", entityId: bankAccountId, action: "updated", metadata: { fields: changedFields(set) },
        });
      }
    });
  }
  return getBankAccount(bankAccountId, userId);
}

/** Soft delete; memberships are kept. `HAS_ACTIVE_CARDS` while non-deleted cards reference it. */
export async function softDeleteBankAccount(bankAccountId: string) {
  const [activeCard] = await db
    .select({ id: card.id })
    .from(card)
    .where(and(eq(card.bankId, bankAccountId), isNull(card.deletedAt)))
    .limit(1);
  if (activeCard) throw new ApiError("HAS_ACTIVE_CARDS");

  await db.transaction(async (tx) => {
    const [result] = await tx
      .update(bankAccount)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(bankAccount.id, bankAccountId), isNull(bankAccount.deletedAt)));

    if (result.affectedRows > 0) {
      await logBankAccountActivity(tx, bankAccountId, { entityType: "bank_account", entityId: bankAccountId, action: "deleted" });
    }
  });
}

/** Idempotent freeze/unfreeze; returns the updated account. */
export async function setBankAccountFrozenState(bankAccountId: string, userId: string, freeze: boolean) {
  const current = await getBankAccount(bankAccountId, userId);
  if (!current) return null;
  if (freeze === Boolean(current.frozenAt)) return current;

  await db.transaction(async (tx) => {
    await tx
      .update(bankAccount)
      .set({ frozenAt: freeze ? new Date() : null, updatedAt: new Date() })
      .where(and(eq(bankAccount.id, bankAccountId), isNull(bankAccount.deletedAt)));
    // Reaching here means the state really changes (the early return above skips no-ops).
    await logBankAccountActivity(tx, bankAccountId, {
      entityType: "bank_account", entityId: bankAccountId, action: freeze ? "frozen" : "unfrozen",
    });
  });
  return getBankAccount(bankAccountId, userId);
}
