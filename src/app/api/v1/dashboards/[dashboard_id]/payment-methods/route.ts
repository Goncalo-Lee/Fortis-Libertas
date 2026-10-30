import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPaymentMethodsByDashboardId } from "@/db/queries/payment-methods/read";
import { createPaymentMethod } from "@/db/queries/payment-methods/write";
import { ApiError } from "@/lib/api/errors";

interface RouteContext {
    params: Promise<{ dashboard_id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { dashboard_id } = await context.params;
        const methods = await getPaymentMethodsByDashboardId(dashboard_id);

        return NextResponse.json({
            data: methods,
            meta: { page: 1, per_page: methods.length, total: methods.length, total_pages: 1 }
        }, { status: 200 });
    } catch (error) {
        // Fazemos console.error para veres exatamente o que falhou no terminal do servidor
        console.error("Erro no GET /payment-methods:", error);
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { dashboard_id } = await context.params;
        const body = await request.json();

        const created = await createPaymentMethod(dashboard_id, session.user.id, {
            name: body.name,
            description: body.description ?? null,
            cardId: body.card_id ?? null,
        });

        return NextResponse.json(
            { data: created },
            { status: 201, headers: { Location: `/api/v1/dashboards/${dashboard_id}/payment-methods/${created?.id}` } }
        );
    } catch (error) {
        if (error instanceof ApiError && error.code === "NAME_ALREADY_EXISTS") {
            return NextResponse.json({ code: "NAME_ALREADY_EXISTS", status: 409 }, { status: 409 });
        }
        console.error("Erro no POST /payment-methods:", error);
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}