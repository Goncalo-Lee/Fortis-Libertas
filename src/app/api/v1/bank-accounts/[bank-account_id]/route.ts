import type { NextRequest } from "next/server";
import { getBankAccountById } from "@/db/queries/bank-accounts"; // <-- Corrigido o nome
import { requireBankAccountRole } from "@/lib/api/access";
import { requireSession } from "@/lib/api/auth";
import { withErrors, ApiError } from "@/lib/api/errors";
import { ok } from "@/lib/api/responses";
import { serializeBankAccount } from "@/lib/api/serializers/bank-account";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ bank_account_id: string }> };

export const GET = withErrors(async (request: NextRequest, { params }: Ctx) => {
    // 1. Resolução dos parâmetros
    const { bank_account_id } = await params;

    // 2. Obter a sessão do utilizador
    const session = await requireSession(request);

    // 3. Access Guard: requer membro com role mínima de 'viewer'
    await requireBankAccountRole(request, bank_account_id, "viewer");

    // 4. Buscar a conta (Corrigido o nome da função e a ORDEM dos argumentos!)
    const result = await getBankAccountById(bank_account_id, session.user.id);

    // 5. Tratamento de inexistência
    if (!result) {
        throw new ApiError("NOT_FOUND");
    }

    // 6. Serialização e resposta
    // Como a query devolve tudo ao mesmo nível (flat), construímos o objeto
    // esperado pelo serializer e extraímos a role.
    const serialized = serializeBankAccount({
        id: result.id,
        name: result.name,
        initialBalance: result.initialBalance,
        frozenAt: result.frozenAt,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
    });

    return ok({
        ...serialized,
        role: result.role // Injetamos a role que vem diretamente do result
    });
});