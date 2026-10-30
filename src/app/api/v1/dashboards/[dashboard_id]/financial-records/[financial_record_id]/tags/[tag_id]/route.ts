import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    linkTagToFinancialRecord,
    unlinkTagFromFinancialRecord
} from "@/db/queries/financial-records/write";

interface RouteContext {
    params: Promise<{
        dashboard_id: string;
        financial_record_id: string;
        tag_id: string;
    }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });
        }

        const { dashboard_id, financial_record_id, tag_id } = await context.params;
        await linkTagToFinancialRecord(dashboard_id, financial_record_id, tag_id);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });
        }

        const { dashboard_id, financial_record_id, tag_id } = await context.params;
        await unlinkTagFromFinancialRecord(dashboard_id, financial_record_id, tag_id);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}