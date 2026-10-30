import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { linkTagToCategory, unlinkTagFromCategory } from "@/db/queries/categories/write";

interface RouteContext {
  params: Promise<{ dashboard_id: string; category_id: string; tag_id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

  const { dashboard_id, category_id, tag_id } = await context.params;
  await linkTagToCategory(dashboard_id, category_id, tag_id);

  return new NextResponse(null, { status: 204 });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

  const { dashboard_id, category_id, tag_id } = await context.params;
  await unlinkTagFromCategory(dashboard_id, category_id, tag_id);

  return new NextResponse(null, { status: 204 });
}