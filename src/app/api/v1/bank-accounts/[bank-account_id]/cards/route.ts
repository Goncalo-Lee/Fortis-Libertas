import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCardsByBankAccountId } from "@/db/queries/cards/read";
import { createCard } from "@/db/queries/cards/write";

interface RouteContext {
    params: Promise<{ bank_account_id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { bank_account_id } = await context.params;
        const cards = await getCardsByBankAccountId(bank_account_id, session.user.id);

        return NextResponse.json({
            data: cards,
            meta: { page: 1, per_page: cards.length, total: cards.length, total_pages: 1 }
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

        const created = await createCard(bank_account_id, session.user.id, {
            cardholderName: body.cardholder_name,
            typeCard: body.type_card,
            cardNumber: body.card_number,
            expiryDate: body.expiry_date,
            cvv: body.cvv,
            userId: body.user_id ?? session.user.id,
        });

        return NextResponse.json(
            { data: created },
            { status: 201, headers: { Location: `/api/v1/cards/${created.id}` } }
        );
    } catch (error) {
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}