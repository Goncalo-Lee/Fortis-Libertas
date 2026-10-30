import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSummaryReport } from "@/db/queries/reports/read";

interface RouteContext {
    params: Promise<{ dashboard_id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { dashboard_id } = await context.params;
        const { searchParams } = new URL(request.url);

        const from = searchParams.get("payment_date_from");
        const to = searchParams.get("payment_date_to");

        if (!from || !to) {
            return NextResponse.json({
                code: "VALIDATION_ERROR",
                status: 422,
                detail: "payment_date_from and payment_date_to are required."
            }, { status: 422 });
        }

        const report = await getSummaryReport(dashboard_id, {
            from: new Date(from),
            to: new Date(to),
            groupBy: (searchParams.get("group_by") as any) ?? "record_type",
            currency: searchParams.get("currency") ?? undefined,
        });

        return NextResponse.json({ data: report }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}