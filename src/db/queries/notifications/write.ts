import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUnreadNotificationsCount } from "@/db/queries/notifications/read";
import { markAllNotificationsAsRead } from "@/db/queries/notifications/write";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { code: "UNAUTHORIZED", message: "Sessão inválida ou não iniciada." },
                { status: 401 }
            );
        }

        const count = await getUnreadNotificationsCount(session.user.id);

        return NextResponse.json({
            data: {
                unread_count: count,
            },
        });
    } catch (error) {
        console.error("Erro ao obter contagem de notificações:", error);
        return NextResponse.json(
            { code: "INTERNAL_SERVER_ERROR", message: "Erro ao processar o pedido." },
            { status: 500 }
        );
    }
}

export async function PATCH() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { code: "UNAUTHORIZED", message: "Sessão inválida ou não iniciada." },
                { status: 401 }
            );
        }

        await markAllNotificationsAsRead(session.user.id);

        return NextResponse.json({
            data: {
                success: true,
            },
        });
    } catch (error) {
        console.error("Erro ao atualizar notificações:", error);
        return NextResponse.json(
            { code: "INTERNAL_SERVER_ERROR", message: "Erro ao atualizar notificações." },
            { status: 500 }
        );
    }
}