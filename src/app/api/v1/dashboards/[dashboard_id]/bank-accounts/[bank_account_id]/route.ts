import type { NextRequest } from "next/server";
import { getBankAccount } from "@/db/queries/bank-accounts"; // Importa a query que criámos
import { requireBankAccountRole } from "@/lib/api/access";
import { requireSession } from "@/lib/api/auth";
import { withErrors, ApiError } from "@/lib/api/errors";
import { ok } from "@/lib/api/responses";
import { serializeBankAccount } from "@/lib/api/serializers/bank-account";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ bank_account_id: string }> };

export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
    // 1. Resolução dos parâmetros (obrigatório no Next.js 16+)[cite: 1]
    const { bank_account_id } = await params;

    // 2. Obter a sessão do utilizador (precisamos do userId para a query)
    const session = await requireSession(request);

    // 3. Access Guard: requer membro com role mínima de 'viewer'[cite: 1, 2]
    await requireBankAccountRole(request, bank_account_id, "viewer");

    // 4. Buscar a conta usando a função da pasta queries
    const result = await getBankAccount(session.user.id, bank_account_id);

    // 5. Tratamento de inexistência (404 NOT_FOUND)[cite: 2]
    if (!result) {
        throw new ApiError("NOT_FOUND");
    }

    // 6. Serialização e resposta 200 OK[cite: 1]
    // O getBankAccount devolve { account, role }, pelo que serializamos a account e injetamos a role
    const serialized = serializeBankAccount(result.account);

    return ok({
        ...serialized,
        role: result.role
    });
});