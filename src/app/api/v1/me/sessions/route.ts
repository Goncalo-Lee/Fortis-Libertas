import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listSessions, revokeOtherSessions } from "@/db/queries/me/sessions";

export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

    const sessions = await listSessions(session.user.id, session.session.id);
    return NextResponse.json({ data: sessions }, { status: 200 });
}

export async function DELETE(request: NextRequest) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

    await revokeOtherSessions(session.user.id, session.session.id);
    return new NextResponse(null, { status: 204 });
}