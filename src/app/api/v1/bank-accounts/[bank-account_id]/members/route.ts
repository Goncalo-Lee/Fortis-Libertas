import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listBankAccountMembers } from "@/db/queries/bank-account-members/read";
import { addBankAccountMember } from "@/db/queries/bank-account-members/write";
import { ApiError } from "@/lib/api/errors";

interface RouteContext {
    params: Promise<{ bank_account_id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { bank_account_id } = await context.params;
        const members = await listBankAccountMembers(bank_account_id, session.user.id);

        return NextResponse.json({
            data: members,
            meta: { page: 1, per_page: members.length, total: members.length, total_pages: 1 }
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { bank_account_id } = await context.params;
        const body = await request.json();

        const member = await addBankAccountMember(bank_account_id, session.user.id, {
            userId: body.user_id,
            email: body.email,
            userName: body.user_name,
            role: body.role,
        });

        return NextResponse.json({ data: member }, { status: 201 });
    } catch (error) {
        if (error instanceof ApiError && error.code === "ALREADY_MEMBER") {
            return NextResponse.json({ code: "ALREADY_MEMBER", status: 409, detail: "User already a member." }, { status: 409 });
        }
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}