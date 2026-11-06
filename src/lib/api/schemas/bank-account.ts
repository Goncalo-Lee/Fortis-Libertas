import { z } from "zod";

const name = z.string().trim().min(1).max(50);
const initialBalance = z.string().regex(/^-?\d{1,8}(\.\d{1,2})?$/, "Must be a decimal with up to 2 places.");

/** Query of GET /bank-accounts (page/per_page are handled by `parsePagination`). */
export const listBankAccountsQuery = z.looseObject({
  q: z.string().trim().max(100).optional(),
  role: z.enum(["owner", "editor", "viewer"]).optional(),
  frozen: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sort: z.enum(["name", "-name", "created_at", "-created_at"]).default("name"),
});

/** `currency` defaults to the caller's profile currency and cannot be changed afterwards. */
export const createBankAccountSchema = z.strictObject({
  name,
  initial_balance: initialBalance,
  currency: z.string().regex(/^[A-Z]{3}$/, "Must be a 3-letter ISO 4217 code.").optional(),
});

export const updateBankAccountSchema = z
  .strictObject({ name, initial_balance: initialBalance })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required." });
