import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCardsByUserId } from "@/db/queries/cards/read";

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) {
            return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const bankId = searchParams.get("bank_id") ?? undefined;
        const typeCard = (searchParams.get("type_card") as "credit" | "debit") ?? undefined;

        const cards = await getCardsByUserId(session.user.id, { bankId, typeCard });

        return NextResponse.json({
            data: cards,
            meta: { page: 1, per_page: cards.length, total: cards.length, total_pages: 1 }
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}