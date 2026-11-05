import { and, asc, count, desc, eq, gte, inArray, isNotNull, isNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { color, currency, icon, recordType, transaction as history, user } from "@/db/schema";
import type { ListTransactionsFilters } from "./type";

/* ======
  READ
======= */

/**
 * Page of the dashboard's history, with who registered each movement, its record type (with color and icon)
 * and the currency code, plus the total for the pagination meta (endpoints.md, section 20).
 *
 * All the joins are INNER: every column they use is NOT NULL with a foreign key (except `source_id`, not joined).
 */
export async function listTransactions(dashboardId: string, f: ListTransactionsFilters) {
  const where = and(
    eq(history.dashboardId, dashboardId),
    f.sourceTypes?.length ? inArray(history.sourceType, f.sourceTypes) : undefined,
    f.recordTypeId ? eq(history.recordTypeId, f.recordTypeId) : undefined,
    f.userId ? eq(history.userId, f.userId) : undefined,
    f.occurredFrom ? gte(history.occurredAt, f.occurredFrom) : undefined,
    f.occurredTo ? lte(history.occurredAt, f.occurredTo) : undefined,
    f.deleted === undefined ? undefined : f.deleted ? isNotNull(history.deletedAt) : isNull(history.deletedAt),
  );

  // Newest movement first by default. The id (UUID v7) breaks ties so pages never repeat or skip rows.
  const order = f.sort === "occurred_at"
    ? [asc(history.occurredAt), asc(history.id)]
    : [desc(history.occurredAt), desc(history.id)];

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: history.id,
        dashboardId: history.dashboardId,
        sourceType: history.sourceType,
        sourceId: history.sourceId,
        name: history.name,
        amount: history.amount,
        currency: currency.code,
        occurredAt: history.occurredAt,
        deletedAt: history.deletedAt,
        createdAt: history.createdAt,
        updatedAt: history.updatedAt,
        user: { id: user.id, userName: user.username, fullName: user.name, image: user.image },
        recordType: { id: recordType.id, name: recordType.name },
        color: { id: color.id, name: color.name, codeColor: color.codeColor, isReserved: color.isReserved },
        icon: { id: icon.id, name: icon.name, codeIcon: icon.codeIcon },
      })
      .from(history)
      .innerJoin(currency, eq(currency.id, history.currencyId))
      .innerJoin(user, eq(user.id, history.userId))
      .innerJoin(recordType, eq(recordType.id, history.recordTypeId))
      .innerJoin(color, eq(color.id, recordType.colorId))
      .innerJoin(icon, eq(icon.id, recordType.iconId))
      .where(where)
      .orderBy(...order)
      .limit(f.limit)
      .offset(f.offset),
    db.select({ total: count() }).from(history).where(where),
  ]);

  return { rows, total };
}

export type TransactionRow = Awaited<ReturnType<typeof listTransactions>>["rows"][number];
