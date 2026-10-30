// freeze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setCardFrozenState } from "@/db/queries/cards/write";

export async function POST(request: NextRequest, context: { params: Promise<{ card_id: string }> }) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

    const { card_id } = await context.params;
    const updated = await setCardFrozenState(card_id, session.user.id, false);
    if (!updated) return NextResponse.json({ code: "NOT_FOUND", status: 404 }, { status: 404 });

    return NextResponse.json({ data: updated }, { status: 200 });
}