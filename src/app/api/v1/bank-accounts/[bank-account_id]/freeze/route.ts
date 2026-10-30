// freeze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setBankAccountFrozenState } from "@/db/queries/bank-accounts/write";

export async function POST(request: NextRequest, context: { params: Promise<{ bank_account_id: string }> }) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

    const { bank_account_id } = await context.params;
    const updated = await setBankAccountFrozenState(bank_account_id, session.user.id, true);
    if (!updated) return NextResponse.json({ code: "NOT_FOUND", status: 404 }, { status: 404 });

    return NextResponse.json({ data: updated }, { status: 200 });
}