// src/lib/api/serializers/bank-account.ts
// Pode importar o tipo do seu schema do Drizzle para garantir type-safety
// import type { BankAccount } from "@/db/schema";

export function serializeBankAccount(account: any) {
    return {
        bank_account_id: account.id, // O ID deve ser retornado como UUID (string)[cite: 1]
        name: account.name,
        initial_balance: account.initialBalance.toString(), // Serializado como string para evitar perda de precisão[cite: 1]
        frozen_at: account.frozenAt ? account.frozenAt.toISOString() : null, // Timestamps em ISO 8601 UTC[cite: 1]
        created_at: account.createdAt.toISOString(),
        updated_at: account.updatedAt.toISOString(),
    };
}