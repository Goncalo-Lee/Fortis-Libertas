// src/lib/api/schemas/bank-account.ts
import { z } from "zod";

export const listBankAccountsQuery = z.object({
    q: z.string().max(100).optional(),
    role: z.enum(["owner", "editor", "viewer"]).optional(),
    // Como os searchParams vêm sempre como string, transformamos para boolean
    frozen: z
        .enum(["true", "false"])
        .transform((val) => val === "true")
        .optional(),
    sort: z
        .enum(["name", "-name", "created_at", "-created_at"])
        .optional(),
    // Permitimos campos extra (como page e per_page) para que não falhe a validação
}).passthrough();

// Se quiser preparar já o esquema para a criação (POST /bank-accounts):
export const createBankAccountSchema = z.object({
    name: z.string().min(1).max(50),
    initial_balance: z.string().regex(/^-?\d{1,8}(\.\d{1,2})?$/),
}).strict(); // Rejeita chaves desconhecidas