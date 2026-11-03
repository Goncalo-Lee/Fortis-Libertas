import { db } from "@/db";
import { userDashboard, user } from "@/db/schema";
import { ApiError } from "@/lib/api/errors";
import { and, eq, sql, count, isNull } from "drizzle-orm";

export async function addDashboardMember(
    dashboardId: string,
    callerUserId: string,
    input: { userId?: string; email?: string; userName?: string; role: "owner" | "editor" | "viewer" }
) {
    let targetUserId = input.userId;

    if (!targetUserId) {
        const [target] = await db
            .select({ id: user.id })
            .from(user)
            .where(input.email ? eq(user.email, input.email) : eq(user.username, input.userName!))
            .limit(1);

        if (!target) throw new ApiError("NOT_FOUND");
        targetUserId = target.id;
    }

    // Check if member exists (including soft-deleted)
    const [existing] = await db
        .select({ role: userDashboard.role, deletedAt: userDashboard.deletedAt })
        .from(userDashboard)
        .where(
            and(
                eq(userDashboard.dashboardId, sql`UUID_TO_BIN(${dashboardId})`),
                eq(userDashboard.userId, sql`UUID_TO_BIN(${targetUserId})`)
            )
        )
        .limit(1);

    if (existing && !existing.deletedAt) throw new ApiError("ALREADY_MEMBER");

    if (existing && existing.deletedAt) {
        // Reactivate per Section 9.3
        await db
            .update(userDashboard)
            .set({ role: input.role, deletedAt: null, updatedAt: new Date() })
            .where(
                and(
                    eq(userDashboard.dashboardId, sql`UUID_TO_BIN(${dashboardId})`),
                    eq(userDashboard.userId, sql`UUID_TO_BIN(${targetUserId})`)
                )
            );
    } else {
        await db.insert(userDashboard).values({
            dashboardId,
            userId: targetUserId,
            role: input.role,
        });
    }

    return { userId: targetUserId, role: input.role };
}

export async function updateDashboardMemberRole(
    dashboardId: string,
    targetUserId: string,
    newRole: "owner" | "editor" | "viewer"
) {
    if (newRole !== "owner") {
        const [ownerCount] = await db
            .select({ count: count() })
            .from(userDashboard)
            .where(
                and(
                    eq(userDashboard.dashboardId, sql`UUID_TO_BIN(${dashboardId})`),
                    eq(userDashboard.role, "owner"),
                    isNull(userDashboard.deletedAt)
                )
            );

        if (Number(ownerCount.count) <= 1) {
            const [isTargetOwner] = await db
                .select({ role: userDashboard.role })
                .from(userDashboard)
                .where(
                    and(
                        eq(userDashboard.dashboardId, sql`UUID_TO_BIN(${dashboardId})`),
                        eq(userDashboard.userId, sql`UUID_TO_BIN(${targetUserId})`),
                        isNull(userDashboard.deletedAt)
                    )
                );

            if (isTargetOwner?.role === "owner") throw new ApiError("LAST_OWNER");
        }
    }

    await db
        .update(userDashboard)
        .set({ role: newRole, updatedAt: new Date() })
        .where(
            and(
                eq(userDashboard.dashboardId, sql`UUID_TO_BIN(${dashboardId})`),
                eq(userDashboard.userId, sql`UUID_TO_BIN(${targetUserId})`)
            )
        );

    return { userId: targetUserId, role: newRole };
}

export async function removeDashboardMember(dashboardId: string, targetUserId: string) {
    const [ownerCount] = await db
        .select({ count: count() })
        .from(userDashboard)
        .where(
            and(
                eq(userDashboard.dashboardId, sql`UUID_TO_BIN(${dashboardId})`),
                eq(userDashboard.role, "owner"),
                isNull(userDashboard.deletedAt)
            )
        );

    const [targetMember] = await db
        .select({ role: userDashboard.role })
        .from(userDashboard)
        .where(
            and(
                eq(userDashboard.dashboardId, sql`UUID_TO_BIN(${dashboardId})`),
                eq(userDashboard.userId, sql`UUID_TO_BIN(${targetUserId})`),
                isNull(userDashboard.deletedAt)
            )
        );

    if (targetMember?.role === "owner" && Number(ownerCount.count) <= 1) {
        throw new ApiError("LAST_OWNER");
    }

    // Soft delete the membership row per Section 9.3
    await db
        .update(userDashboard)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(
            and(
                eq(userDashboard.dashboardId, sql`UUID_TO_BIN(${dashboardId})`),
                eq(userDashboard.userId, sql`UUID_TO_BIN(${targetUserId})`)
            )
        );
}