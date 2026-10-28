import { and, asc, count, desc, eq, isNotNull, isNull, like } from "drizzle-orm";
import { db } from "@/db"; // Ajuste o path conforme o seu projeto
import { bankAccount, bankAccountUser } from "@/db/schema"; // Ajuste os nomes exportados do seu schema
import { escapeLike } from "@/db/utils";
import type { ListFiltersBankAccount } from "./type"; // Terá de criar este tipo baseado na validação Zod

/* ======
  READ
======= */

/**
 * Retrieves a single active bank account by its ID, including the caller's role.
 *
 * @param userId The unique identifier of the user making the request.
 * @param id The unique identifier of the bank account.
 * @returns The bank account record and the user's role if found and not soft-deleted, or `null` otherwise.
 *
 * @example
 * const result = await getBankAccount("user_123", "bank_456");
 * if (result) {
 *   console.log(`Account found: ${result.account.name}, Role: ${result.role}`);
 * }
 */
export async function getBankAccount(userId: string, id: string) {
    const [row] = await db
        .select({
            account: bankAccount,
            role: bankAccountUser.role, // Derived: the caller's role
        })
        .from(bankAccount)
        .innerJoin(
            bankAccountUser,
            eq(bankAccount.id, bankAccountUser.bankId)
        )
        .where(
            and(
                eq(bankAccount.id, id),
                eq(bankAccountUser.userId, userId),
                isNull(bankAccount.deletedAt) // Exclui contas apagadas
            )
        )
        .limit(1);

    return row ?? null;
}

/**
 * Lists active bank accounts the caller belongs to, with optional search, role filter, frozen status, sorting and pagination.
 *
 * Filters are combined with AND. `q` performs a partial match on the name. Results are sorted
 * by the requested field (default: name), with `id` as a tie-breaker so pagination stays stable.
 *
 * @param userId The unique identifier of the user (caller) to list accounts for.
 * @param f Filters, sort order and pagination options (see `ListFiltersBankAccount`).
 * @returns The current page of `rows` and the `total` number of matching bank accounts.
 *
 * @example
 * const { rows, total } = await listBankAccounts("user_123", {
 *   q: "savings",
 *   frozen: false,
 *   sort: "-created_at",
 *   limit: 25,
 *   offset: 0,
 * });
 */
export async function listBankAccounts(userId: string, f: ListFiltersBankAccount) {
    const where = and(
        // Garante que só lista as contas em que o utilizador é membro[cite: 2]
        eq(bankAccountUser.userId, userId),
        // Exclui contas com soft delete[cite: 2]
        isNull(bankAccount.deletedAt),
        // Pesquisa por nome (q)[cite: 2]
        f.q ? like(bankAccount.name, `%${escapeLike(f.q)}%`) : undefined,
        // Filtro por role (owner, editor, viewer)[cite: 2]
        f.role ? eq(bankAccountUser.role, f.role) : undefined,
        // Filtro frozen: true -> frozen_at IS NOT NULL, false -> frozen_at IS NULL[cite: 2]
        f.frozen === true
            ? isNotNull(bankAccount.frozenAt)
            : f.frozen === false
                ? isNull(bankAccount.frozenAt)
                : undefined
    );

    // A ordenação permitida é por 'name' (padrão) e 'created_at'[cite: 2]
    const order = {
        name: asc(bankAccount.name),
        "-name": desc(bankAccount.name),
        created_at: asc(bankAccount.createdAt),
        "-created_at": desc(bankAccount.createdAt),
    }[f.sort ?? "name"]; // Default sort: name[cite: 2]

    const rows = await db
        .select({
            account: bankAccount,
            role: bankAccountUser.role, // O role do chamador tem de ser devolvido[cite: 2]
        })
        .from(bankAccount)
        .innerJoin(
            bankAccountUser,
            eq(bankAccount.id, bankAccountUser.bankId)
        )
        .where(where)
        .orderBy(order, asc(bankAccount.id))
        .limit(f.limit)
        .offset(f.offset);

    const [totalRow] = await db
        .select({ total: count() })
        .from(bankAccount)
        .innerJoin(
            bankAccountUser,
            eq(bankAccount.id, bankAccountUser.bankId)
        )
        .where(where);

    return { rows, total: totalRow?.total ?? 0 };
}

/**
 * Finds the membership relationship between a user and a bank account.
 * Used primarily by the access control layer (requireBankAccountRole) to verify permissions.
 */
export async function findBankAccountMembership(bankAccountId: string, userId: string) {
    const [row] = await db
        .select({
            bankAccount: bankAccount, // Devolve os dados da tabela Bank_Account
            role: bankAccountUser.role, // Traz a role da tabela Bank_Account__User[cite: 2]
        })
        .from(bankAccount)
        .innerJoin(
            bankAccountUser,
            eq(bankAccount.id, bankAccountUser.bankId)
        )
        .where(
            and(
                eq(bankAccount.id, bankAccountId),
                eq(bankAccountUser.userId, userId),
                isNull(bankAccount.deletedAt) // Exclui contas apagadas[cite: 1]
            )
        )
        .limit(1);

    return row ?? null;
}