import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
    const [result] = await db
        .select({
            total: sql<number>`count(*)`.mapWith(Number),
        })
        .from(notifications)
        .where(
            and(
                eq(notifications.userId, sql`UUID_TO_BIN(${userId})`),
                isNull(notifications.readAt)
            )
        );

    return result?.total ?? 0;
}