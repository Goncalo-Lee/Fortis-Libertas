import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listCategories } from "@/db/queries/categories/read";
import { createCategory } from "@/db/queries/categories/write";
import { ApiError } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ dashboard_id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

    // 2. O AWAIT AQUI É OBRIGATÓRIO!
    const { dashboard_id } = await context.params;

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const perPage = parseInt(searchParams.get("per_page") ?? "15", 10);
    const offset = (page - 1) * perPage;

    const { rows, total } = await listCategories(dashboard_id, {
      q: searchParams.get("q") ?? undefined,
      tagId: searchParams.get("tag_id") ?? undefined,
      sort: (searchParams.get("sort") as any) ?? "name",
      limit: perPage,
      offset,
      includeTags: searchParams.get("include") === "tags",
    });

    return NextResponse.json({
      data: rows,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Erro no GET /categories:", error);
    return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ code: "UNAUTHENTICATED", status: 401 }, { status: 401 });

    const { dashboard_id } = await context.params;
    const body = await request.json();

    const created = await createCategory(dashboard_id, {
      name: body.name,
      description: body.description ?? null,
      tagIds: body.tag_ids ?? [],
    });

    return NextResponse.json(
        { data: created },
        { status: 201, headers: { Location: `/api/v1/dashboards/${dashboard_id}/categories/${created.id}` } }
    );
  } catch (error) {
    if (error instanceof ApiError && error.code === "NAME_ALREADY_EXISTS") {
      return NextResponse.json({ code: "NAME_ALREADY_EXISTS", status: 409 }, { status: 409 });
    }
    return NextResponse.json({ code: "INTERNAL_ERROR", status: 500 }, { status: 500 });
  }
}