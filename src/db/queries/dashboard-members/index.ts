/**
 * Public entry point for dashboard member queries and mutations.
 *
 * The shared rules (last owner, soft delete, reactivation) live in `../memberships.ts`, which
 * `bank-account-members` uses too. Import from `dashboard-members` rather than from the individual modules:
 * - `type.ts`: `Tx` and `MemberRow` types
 * - `read.ts`: reading and listing members
 * - `write.ts`: adding, changing the role of, and removing members
 */
export * from "./type";
export * from "./read";
export * from "./write";
