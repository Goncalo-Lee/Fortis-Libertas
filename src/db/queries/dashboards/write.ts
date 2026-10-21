import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "../..";
import { dashboard, recordType, userDashboard } from "../../schema";
import { generateId } from "../../types";

/* =======
  WRITE
======== */

/** Record types seeded automatically when a dashboard is created. */
const DEFAULT_RECORD_TYPES = ["Expenses", "Income", "Investment"];

/**
 * Creates a new dashboard atomically.
 *
 * Within a single transaction it:
 * 1. Creates the dashboard record.
 * 2. Creates the owner membership for the requesting user.
 * 3. Seeds the default record types (Expenses, Income, Investment).
 *
 * If any step fails, the whole transaction is rolled back.
 *
 * @param userId - The ID of the user who becomes the owner
 * @param input - The dashboard name and an optional active status (defaults to `true`)
 * @returns The generated ID of the new dashboard
 *
 * @example
 * const dashboardId = await createDashboard("user_456", { name: "Household budget" });
 */
export async function createDashboard(
  userId: string,
  input: { name: string; is_active?: boolean },
) {
  const id = generateId();

  await db.transaction(async (tx) => {
    await tx.insert(dashboard).values({
      id,
      name: input.name,
      isActive: input.is_active ?? true,
    });

    await tx.insert(userDashboard).values({ dashboardId: id, userId, role: "owner" });

    await tx.insert(recordType).values(
      DEFAULT_RECORD_TYPES.map((name) => ({ id: generateId(), dashboardId: id, name })),
    );
  });

  return id;
}

/**
 * Updates a dashboard's name and/or active status.
 *
 * Only the fields explicitly provided are written, so a partial payload never
 * overwrites unrelated columns. The write is skipped entirely when there is
 * nothing to change, which avoids an unnecessary `updatedAt` bump.
 *
 * Note: the final SELECT does not filter on `deletedAt`, so a soft-deleted
 * dashboard is still returned if it matches the ID.
 *
 * @param id - The dashboard ID
 * @param changes - The fields to update (`name` and/or `is_active`)
 * @returns The post-update dashboard row, or `null` if no row matches the ID
 *
 * @example
 * const updated = await updateDashboard("dash_123", { name: "Shared budget" });
 */
export async function updateDashboard(
  id: string,
  changes: { name?: string; is_active?: boolean },
) {
  const set: Partial<typeof dashboard.$inferInsert> = {};

  // Compare against `undefined` so that `false` and `""` are still applied
  if (changes.name !== undefined) set.name = changes.name;
  if (changes.is_active !== undefined) set.isActive = changes.is_active;

  if (Object.keys(set).length > 0) {
    await db
      .update(dashboard)
      .set({ ...set, updatedAt: new Date() })
      .where(and(eq(dashboard.id, id), isNull(dashboard.deletedAt))); // Soft-delete guard
  }

  const [row] = await db.select().from(dashboard).where(eq(dashboard.id, id)).limit(1);

  return row ?? null;
}

/**
 * Soft-deletes a dashboard by setting its `deletedAt` timestamp.
 *
 * Idempotent: calling it on an already deleted dashboard has no effect.
 *
 * @param id - The dashboard ID
 * @returns Nothing; the operation is fire-and-forget
 *
 * @example
 * await softDeleteDashboard("dash_123");
 */
export async function softDeleteDashboard(id: string) {
  await db
    .update(dashboard)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(dashboard.id, id), isNull(dashboard.deletedAt)));
}

/**
 * Restores a soft-deleted dashboard by clearing its `deletedAt` timestamp.
 *
 * Only affects dashboards that are currently deleted, so restoring an active
 * dashboard is a no-op and does not bump `updatedAt`.
 *
 * Note: the final SELECT does not filter on `deletedAt`, so the row is returned
 * whether or not the UPDATE matched.
 *
 * @param id - The dashboard ID
 * @returns The dashboard row, or `null` if no row matches the ID
 *
 * @example
 * const restored = await restoreDashboard("dash_123");
 */
export async function restoreDashboard(id: string) {
  await db
    .update(dashboard)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(and(eq(dashboard.id, id), isNotNull(dashboard.deletedAt)));

  const [row] = await db.select().from(dashboard).where(eq(dashboard.id, id)).limit(1);

  return row ?? null;
}
