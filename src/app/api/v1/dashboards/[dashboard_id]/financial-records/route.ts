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

        // 🚨 VALIDAÇÃO DE SEGURANÇA (Protege o UUID_TO_BIN contra undefined) 🚨
        if (!body.record_type_id || !body.category_id || !body.payment_method_id) {
            console.error("🔥 [API_VALIDATION_ERROR] Campos em falta no body:", body);
            return NextResponse.json(
                {
                    code: "VALIDATION_ERROR",
                    message: "Faltam campos obrigatórios ou estão indefinidos (record_type_id, category_id, payment_method_id)."
                },
                { status: 400 }
            );
        }

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
        console.error("🔥 [POST_FINANCIAL_RECORDS_ERROR]:", error);
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}