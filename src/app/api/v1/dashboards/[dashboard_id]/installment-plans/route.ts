import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInstallmentPlansByDashboardId } from "@/db/queries/installment-plans/read";
import { createInstallmentPlan } from "@/db/queries/installment-plans/write";

interface RouteContext {
    params: Promise<{ dashboard_id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { dashboard_id } = await context.params;
        const plans = await getInstallmentPlansByDashboardId(dashboard_id);

        return NextResponse.json({
            data: plans,
            meta: { page: 1, per_page: plans.length, total: plans.length, total_pages: 1 }
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { dashboard_id } = await context.params;
        const body = await request.json();

        const created = await createInstallmentPlan(dashboard_id, session.user.id, {
            name: body.name,
            description: body.description ?? null,
            totalAmount: String(body.total_amount),
            totalInstallments: Number(body.total_installments),
            dueDate: body.due_date,
            status: body.status ?? "pending",
        });

        return NextResponse.json(
            { data: created },
            { status: 201, headers: { Location: `/api/v1/dashboards/${dashboard_id}/installment-plans/${created.id}` } }
        );
    } catch (error) {
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}