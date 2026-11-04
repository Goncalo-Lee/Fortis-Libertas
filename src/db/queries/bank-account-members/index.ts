/**
 * Public entry point for bank account member queries and mutations.
 *
 * The shared rules (last owner, soft delete, reactivation) live in `../memberships.ts`; this folder adds
 * what is specific to bank accounts (lookup by email or user name, the cards check).
 */
export * from "./read";
export * from "./write";
export * from "./type";
