// app/api/v1/dashboards/[id]/balance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDashboardCurrentBalance } from "@/db/queries/dashboards/read";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const balance = await getDashboardCurrentBalance(params.id);

        return NextResponse.json({ success: true, data: { balance } });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Erro ao calcular saldo" }, { status: 500 });
    }
}