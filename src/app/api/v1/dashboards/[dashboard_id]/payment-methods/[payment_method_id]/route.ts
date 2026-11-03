import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPaymentMethod } from "@/db/queries/payment-methods/read";
import { updatePaymentMethod, softDeletePaymentMethod } from "@/db/queries/payment-methods/write";
import { ApiError } from "@/lib/api/errors";

interface RouteContext {
    params: Promise<{ dashboard_id: string; payment_method_id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
    const { dashboard_id, payment_method_id } = await context.params;
    const method = await getPaymentMethod(dashboard_id, payment_method_id);
    if (!method) return NextResponse.json({ code: "NOT_FOUND", status: 404 }, { status: 404 });
    return NextResponse.json({ data: method }, { status: 200 });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { dashboard_id, payment_method_id } = await context.params;
        const body = await request.json();

        const updated = await updatePaymentMethod(dashboard_id, payment_method_id, session.user.id, {
            name: body.name,
            description: body.description,
            cardId: body.card_id,
        });

        return NextResponse.json({ data: updated }, { status: 200 });
    } catch (error) {
        if (error instanceof ApiError && error.code === "FORBIDDEN") {
            return NextResponse.json({ code: "FORBIDDEN", status: 403, detail: "Cannot edit others' payment methods." }, { status: 403 });
        }
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { dashboard_id, payment_method_id } = await context.params;
        await softDeletePaymentMethod(dashboard_id, payment_method_id, session.user.id);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        if (error instanceof ApiError && error.code === "IN_USE") {
            return NextResponse.json({ code: "IN_USE", status: 409, detail: "Referenced by financial records." }, { status: 409 });
        }
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}