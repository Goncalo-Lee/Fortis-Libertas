import { and, asc, count, desc, eq, isNull, like } from "drizzle-orm";
import { db } from "@/db";
import { paymentMethod } from "@/db/schema";
import { escapeLike } from "@/db/utils";
import { inDashboard } from "../utils";
import type { ListFiltersPaymentMethod } from "./type";

/* ======
  READ
======= */

/** One non-deleted payment method of the dashboard, or `null`. */
export async function getPaymentMethod(dashboardId: string, id: string) {
  const [row] = await db
    .select()
    .from(paymentMethod)
    .where(inDashboard(paymentMethod, dashboardId, id))
    .limit(1);
  return row ?? null;
}

/** Page of the dashboard's payment methods and the total. `id` breaks sort ties. */
export async function listPaymentMethods(dashboardId: string, f: ListFiltersPaymentMethod) {
  const where = and(
    eq(paymentMethod.dashboardId, dashboardId),
    isNull(paymentMethod.deletedAt),
    f.q ? like(paymentMethod.name, `%${escapeLike(f.q)}%`) : undefined,
    f.userId ? eq(paymentMethod.userId, f.userId) : undefined,
    f.cardId ? eq(paymentMethod.cardId, f.cardId) : undefined,
  );

  const order = {
    name: asc(paymentMethod.name),
    "-name": desc(paymentMethod.name),
    created_at: asc(paymentMethod.createdAt),
    "-created_at": desc(paymentMethod.createdAt),
  }[f.sort];

  const rows = await db
    .select()
    .from(paymentMethod)
    .where(where)
    .orderBy(order, asc(paymentMethod.id))
    .limit(f.limit)
    .offset(f.offset);

  const [totalRow] = await db.select({ total: count() }).from(paymentMethod).where(where);

  return { rows, total: totalRow?.total ?? 0 };
}
