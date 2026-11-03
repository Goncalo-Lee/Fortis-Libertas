import { db } from "@/db";
import { userDashboard, user } from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

export async function listDashboardMembers(dashboardId: string) {
    return db
        .select({
            userId: user.id,
            userName: user.username,
            fullName: user.name,
            image: user.image,
            role: userDashboard.role,
            createdAt: userDashboard.createdAt,
            updatedAt: userDashboard.updatedAt,
        })
        .from(userDashboard)
        .innerJoin(user, eq(userDashboard.userId, user.id))
        .where(
            and(
                eq(userDashboard.dashboardId, sql`UUID_TO_BIN
                (
                ${dashboardId}
                )`),
                isNull(userDashboard.deletedAt)
            )
        );
}