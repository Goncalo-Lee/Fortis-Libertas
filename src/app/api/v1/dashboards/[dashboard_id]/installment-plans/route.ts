// src/app/api/v1/dashboards/[dashboardId]/installment-plans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getInstallmentPlansByDashboardId } from "@/db/queries/installment-plans/read";

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

        const plans = await getInstallmentPlansByDashboardId(dashboardId);

        return NextResponse.json(plans, { status: 200 });
    } catch (error) {
        console.error("❌ Erro ao listar planos de prestações:", error);
        return NextResponse.json(
            { error: "Erro interno ao processar planos de prestações" },
            { status: 500 }
        );
    }
}