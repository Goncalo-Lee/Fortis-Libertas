import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCategory } from "@/db/queries/categories/read";
import { updateCategory, softDeleteCategory } from "@/db/queries/categories/write";
import { ApiError } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ dashboard_id: string; category_id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { dashboard_id, category_id } = await context.params;
  const item = await getCategory(dashboard_id, category_id);
  if (!item) return NextResponse.json({ code: "NOT_FOUND", status: 404 }, { status: 404 });
  return NextResponse.json({ data: item }, { status: 200 });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

    const { dashboard_id, category_id } = await context.params;
    const body = await request.json();

    const updated = await updateCategory(dashboard_id, category_id, {
      name: body.name,
      description: body.description,
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

    const { dashboard_id, category_id } = await context.params;
    await softDeleteCategory(dashboard_id, category_id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError && error.code === "IN_USE") {
      return NextResponse.json({ code: "IN_USE", status: 409, detail: "Category referenced by records." }, { status: 409 });
    }
    return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
  }
}