// src/app/api/v1/bank-accounts/route.ts
import type { NextRequest } from "next/server";
import { listBankAccounts } from "@/db/queries/bank-accounts";
import { requireSession } from "@/lib/api/auth";
import { withErrors } from "@/lib/api/errors";
import { parsePagination } from "@/lib/api/pagination";
import { paginated } from "@/lib/api/responses";
import { listBankAccountsQuery } from "@/lib/api/schemas/bank-account";
import { serializeBankAccount } from "@/lib/api/serializers/bank-account";

export const runtime = "nodejs";

export const GET = withErrors(async (request: NextRequest) => {
    // 1. O utilizador tem de estar autenticado (Min. Role: session)[cite: 2]
    const session = await requireSession(request);

    // 2. Extrair parâmetros de paginação e de pesquisa (q, sort, role, frozen)[cite: 2]
    const { searchParams } = request.nextUrl;
    const { page, perPage, offset } = parsePagination(searchParams);
    const filters = listBankAccountsQuery.parse(
        Object.fromEntries(searchParams),
    );

    // 3. Executar a query delegando para a camada de base de dados
    // Passamos o user.id da sessão porque só podemos listar as contas a que ele pertence[cite: 2]
    const { rows, total } = await listBankAccounts(session.user.id, {
        ...filters,
        limit: perPage,
        offset,
    });

    // 4. Serializar e devolver a resposta paginada
    return paginated(
        rows.map((r) => {
            // Assumindo que a sua query 'listBankAccounts' devolve { account, role }
            const serialized = serializeBankAccount(r.account);
            return {
                ...serialized,
                role: r.role, // Injetar a role derivada na resposta[cite: 2]
            };
        }),
        { page, perPage, total },
    );
});