/**
 * Shared membership logic of dashboards (`User__Dashboard`) and bank accounts (`Bank_Account__User`).
 *
 * - `type.ts`: `Membership` descriptors, `MemberRow`, `Tx`
 * - `read.ts`: active member predicate, get and list
 * - `write.ts`: add (or reactivate), change role and remove, with the last-owner rule
 *
 * `dashboard-members` and `bank-account-members` wrap these with their own table.
 */
export * from "./type";
export * from "./read";
export * from "./write";
