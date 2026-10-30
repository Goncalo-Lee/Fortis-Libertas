import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateBankAccountMemberRole, removeBankAccountMember } from "@/db/queries/bank-account-members/write";
import { ApiError } from "@/lib/api/errors";

interface RouteContext {
    params: Promise<{ bank_account_id: string; user_id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { bank_account_id, user_id } = await context.params;
        const body = await request.json();

        const updated = await updateBankAccountMemberRole(bank_account_id, session.user.id, user_id, body.role);
        return NextResponse.json({ data: updated }, { status: 200 });
    } catch (error) {
        if (error instanceof ApiError && error.code === "LAST_OWNER") {
            return NextResponse.json({ code: "LAST_OWNER", status: 409, detail: "Cannot demote the last owner." }, { status: 409 });
        }
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { bank_account_id, user_id } = await context.params;
        await removeBankAccountMember(bank_account_id, session.user.id, user_id);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        if (error instanceof ApiError && error.code === "MEMBER_HAS_CARDS") {
            return NextResponse.json({ code: "MEMBER_HAS_CARDS", status: 409, detail: "Member still owns cards on this account." }, { status: 409 });
        }
        if (error instanceof ApiError && error.code === "LAST_OWNER") {
            return NextResponse.json({ code: "LAST_OWNER", status: 409, detail: "Cannot remove the last owner." }, { status: 409 });
        }
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}