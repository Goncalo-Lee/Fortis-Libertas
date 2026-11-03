import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFinancialRecordsByDashboardId } from "@/db/queries/financial-records/read";
import { createFinancialRecord } from "@/db/queries/financial-records/write";

interface RouteContext {
    params: Promise<{ dashboard_id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { dashboard_id } = await context.params;
        const records = await getFinancialRecordsByDashboardId(dashboard_id);

        return NextResponse.json({
            data: records,
            meta: { page: 1, per_page: records.length, total: records.length, total_pages: 1 }
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

        const created = await createFinancialRecord(dashboard_id, session.user.id, {
            recordTypeId: body.record_type_id,
            categoryId: body.category_id,
            paymentMethodId: body.payment_method_id,
            installmentPlanId: body.installment_plan_id ?? null,
            name: body.name,
            description: body.description ?? null,
            price: String(body.price),
            currency: body.currency ?? "EUR",
            paymentDate: new Date(body.payment_date),
            status: body.status,
            tagIds: body.tag_ids ?? [],
        });

        return NextResponse.json(
            { data: created },
            { status: 201, headers: { Location: `/api/v1/dashboards/${dashboard_id}/financial-records/${created.id}` } }
        );
    } catch (error) {
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}