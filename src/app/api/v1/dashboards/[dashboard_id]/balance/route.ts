import type { NextRequest } from "next/server";
import { z } from "zod";
import { getDashboardBalance } from "@/db/queries/dashboards/read";
import { getOrCreateProfile } from "@/db/queries/me";
import { requireCurrencyId } from "@/db/queries/catalogs";
import { requireDashboardRole } from "@/lib/api/access";
import { withErrors } from "@/lib/api/errors";
import { parseUuid } from "@/lib/api/ids";
import { ok } from "@/lib/api/responses";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ dashboard_id: string }> };

const query = z.looseObject({
  currency: z.string().regex(/^[A-Z]{3}$/, "Must be a 3-letter ISO 4217 code.").optional(),
});

/**
 * GET /dashboards/{dashboard_id}/balance: net of the dashboard's paid or settled records (income minus expense),
 * converted into `currency` (default: the caller's profile currency).
 */
export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
  const dashboardId = parseUuid((await params).dashboard_id);
  const { session } = await requireDashboardRole(request, dashboardId, "viewer");
  const { currency } = query.parse(Object.fromEntries(request.nextUrl.searchParams));

  const code = currency ?? (await getOrCreateProfile(session.user.id)).currency;
  if (currency) await requireCurrencyId(currency); // 422 for an unsupported currency

  return ok({ balance: await getDashboardBalance(dashboardId, code), currency: code });
});
