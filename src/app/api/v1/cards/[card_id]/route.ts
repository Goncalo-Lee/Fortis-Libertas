import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCardById } from "@/db/queries/cards/read";
import { updateCard, softDeleteCard } from "@/db/queries/cards/write";

interface RouteContext {
    params: Promise<{ card_id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { card_id } = await context.params;
        const cardData = await getCardById(card_id, session.user.id);
        if (!cardData) {
            return NextResponse.json({ code: "NOT_FOUND", status: 404, detail: "Card not found." }, { status: 404 });
        }

        return NextResponse.json({ data: cardData }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { card_id } = await context.params;
        const body = await request.json();

        const updated = await updateCard(card_id, session.user.id, {
            cardholderName: body.cardholder_name,
            typeCard: body.type_card,
            cardNumber: body.card_number,
            expiryDate: body.expiry_date,
            cvv: body.cvv,
        });

        if (!updated) return NextResponse.json({ code: "NOT_FOUND", status: 404 }, { status: 404 });

        return NextResponse.json({ data: updated }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

        const { card_id } = await context.params;
        await softDeleteCard(card_id, session.user.id);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
    }
}