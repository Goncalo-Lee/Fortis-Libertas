// src/app/api/v1/bank-accounts/route.ts
import type { NextRequest } from "next/server";
import { getBankAccountsByUserId } from "@/db/queries/bank-accounts";
import { requireSession } from "@/lib/api/auth";
import { withErrors } from "@/lib/api/errors";
import { parsePagination } from "@/lib/api/pagination";
import { paginated } from "@/lib/api/responses";
import { listBankAccountsQuery } from "@/lib/api/schemas/bank-account";
import { serializeBankAccount } from "@/lib/api/serializers/bank-account";

export const runtime = "nodejs";

export const GET = withErrors(async (request: NextRequest) => {
    // 1. O utilizador tem de estar autenticado (Min. Role: session)
    const session = await requireSession(request);

    const { searchParams } = request.nextUrl;
    const { page, perPage, offset } = parsePagination(searchParams);
    const filters = listBankAccountsQuery.parse(
        Object.fromEntries(searchParams),
    );

    // 3. Executar a query delegando para a camada de base de
    const list = await getBankAccountsByUserId(session.user.id, {
        frozen: searchParams.get("frozen") === "true" ? true : undefined,
        q: searchParams.get("q") ?? undefined
    });

    const total = list.length;
    const rows = list.slice(offset, offset + perPage);

    return paginated(
        rows.map((r) => {
            // A nossa query já devolve as propriedades ao mesmo nível.
            // Passamos os dados da conta para o serializer e extraímos a role.
            const serialized = serializeBankAccount({
                id: r.id,
                name: r.name,
                initialBalance: r.initialBalance,
                frozenAt: r.frozenAt,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
            });

            return {
                ...serialized,
                role: r.role, // Injetar a role diretamente
            };
        }),
        { page, perPage, total },
    );
});