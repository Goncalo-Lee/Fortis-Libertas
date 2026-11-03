import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listCategoryTags } from "@/db/queries/categories/read";
import { replaceCategoryTags } from "@/db/queries/categories/write";

interface RouteContext {
  params: Promise<{ dashboard_id: string; category_id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { dashboard_id, category_id } = await context.params;
  const tags = await listCategoryTags(dashboard_id, category_id);
  return NextResponse.json({ data: tags }, { status: 200 });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

    const { dashboard_id, category_id } = await context.params;
    const body = await request.json();

    await replaceCategoryTags(dashboard_id, category_id, body.tag_ids ?? []);
    return NextResponse.json({ data: { updated: true } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
  }
}