import { NextRequest, NextResponse } from "next/server";
import { getCardsByDashboardId } from "@/db/queries/cards";

interface RouteContext {
    params: Promise<{
        dashboardId: string;
    }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        // No Next.js 15+ os params são uma Promise
        const { dashboardId } = await context.params;

        if (!dashboardId || dashboardId === "undefined") {
            return NextResponse.json(
                { error: "Dashboard ID inválido ou em falta" },
                { status: 400 }
            );
        }

        // Opcional: Validar se a sessão atual tem acesso ao dashboard aqui

        // Busca os dados através da camada de queries
        const cards = await getCardsByDashboardId(dashboardId);

        // Retorna array JSON (mesmo que vazio []) para o FinancialContext não falhar
        return NextResponse.json(cards, { status: 200 });

    } catch (error) {
        console.error("❌ Erro ao listar cartões do dashboard:", error);
        return NextResponse.json(
            { error: "Erro interno ao processar cartões" },
            { status: 500 }
        );
    }
}