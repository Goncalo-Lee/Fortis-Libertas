// src/app/api/v1/dashboards/[dashboardId]/payment-methods/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPaymentMethodsByDashboardId } from "@/db/queries/payment-methods/read";

interface RouteContext {
    params: Promise<{
        dashboardId: string;
    }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { dashboardId } = await context.params;

        if (!dashboardId || dashboardId === "undefined") {
            return NextResponse.json(
                { error: "Dashboard ID inválido ou em falta" },
                { status: 400 }
            );
        }

        const methods = await getPaymentMethodsByDashboardId(dashboardId);

        return NextResponse.json(methods, { status: 200 });
    } catch (error) {
        console.error("❌ Erro ao listar métodos de pagamento:", error);
        return NextResponse.json(
            { error: "Erro interno ao processar métodos de pagamento" },
            { status: 500 }
        );
    }
}