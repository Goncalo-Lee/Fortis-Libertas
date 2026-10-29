// src/app/api/v1/dashboards/[dashboardId]/financial-records/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFinancialRecordsByDashboardId } from "@/db/queries/financial-records/read";

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

        const records = await getFinancialRecordsByDashboardId(dashboardId);

        return NextResponse.json(records, { status: 200 });
    } catch (error) {
        console.error("❌ Erro ao listar registos financeiros:", error);
        return NextResponse.json(
            { error: "Erro interno ao processar registos financeiros" },
            { status: 500 }
        );
    }
}