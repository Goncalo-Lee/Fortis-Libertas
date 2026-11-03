import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFinancialRecord } from "@/db/queries/financial-records/read";
import { updateFinancialRecord, softDeleteFinancialRecord } from "@/db/queries/financial-records/write";

interface RouteContext {
    params: Promise<{ dashboard_id: string; financial_record_id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
    const { dashboard_id, financial_record_id } = await context.params;
    const record = await getFinancialRecord(dashboard_id, financial_record_id);
    if (!record) return NextResponse.json({ code: "NOT_FOUND", status: 404 }, { status: 404 });
    return NextResponse.json({ data: record }, { status: 200 });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { dashboard_id, financial_record_id } = await context.params;
        const body = await request.json();

        const updated = await updateFinancialRecord(dashboard_id, financial_record_id, {
            recordTypeId: body.record_type_id,
            categoryId: body.category_id,
            paymentMethodId: body.payment_method_id,
            installmentPlanId: body.installment_plan_id,
            name: body.name,
            description: body.description,
            price: body.price !== undefined ? String(body.price) : undefined,
            currency: body.currency,
            paymentDate: body.payment_date ? new Date(body.payment_date) : undefined,
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

        const { dashboard_id, financial_record_id } = await context.params;
        await softDeleteFinancialRecord(dashboard_id, financial_record_id);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}