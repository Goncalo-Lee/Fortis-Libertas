import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revokeSessionById } from "@/db/queries/me/sessions";

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ session_id: string }> }
) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

    const { session_id } = await context.params;
    if (session_id === session.session.id) {
        return NextResponse.json({
            code: "CURRENT_SESSION",
            status: 409,
            detail: "Use /api/auth/sign-out to terminate current session."
        }, { status: 409 });
    }

    await revokeSessionById(session.user.id, session_id);
    return new NextResponse(null, { status: 204 });
}