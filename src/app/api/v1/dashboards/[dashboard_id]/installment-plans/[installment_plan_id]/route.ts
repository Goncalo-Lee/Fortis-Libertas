import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInstallmentPlan } from "@/db/queries/installment-plans/read";
import { updateInstallmentPlan, softDeleteInstallmentPlan } from "@/db/queries/installment-plans/write";
import { ApiError } from "@/lib/api/errors";

interface RouteContext {
    params: Promise<{ dashboard_id: string; installment_plan_id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
    const { dashboard_id, installment_plan_id } = await context.params;
    const plan = await getInstallmentPlan(dashboard_id, installment_plan_id);
    if (!plan) return NextResponse.json({ code: "NOT_FOUND", status: 404 }, { status: 404 });
    return NextResponse.json({ data: plan }, { status: 200 });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { dashboard_id, installment_plan_id } = await context.params;
        const body = await request.json();

        const updated = await updateInstallmentPlan(dashboard_id, installment_plan_id, {
            name: body.name,
            description: body.description,
            totalAmount: body.total_amount !== undefined ? String(body.total_amount) : undefined,
            totalInstallments: body.total_installments !== undefined ? Number(body.total_installments) : undefined,
            dueDate: body.due_date,
            status: body.status,
        });

        return NextResponse.json({ data: updated }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { dashboard_id, installment_plan_id } = await context.params;
        const { searchParams } = new URL(request.url);
        const detachRecords = searchParams.get("detach_records") === "true";

        await softDeleteInstallmentPlan(dashboard_id, installment_plan_id, detachRecords);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        if (error instanceof ApiError && error.code === "IN_USE") {
            return NextResponse.json(
                { code: "IN_USE", status: 409, detail: "Linked records exist. Pass ?detach_records=true to unbind." },
                { status: 409 }
            );
        }
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}