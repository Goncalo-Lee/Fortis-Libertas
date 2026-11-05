/**
 * Activity logs (endpoints.md, section 19): read-only audit trail of who did what.
 * - `write.ts`: `logActivity`, called by the other queries inside their transactions
 * - `read.ts`: the paginated list of a dashboard, bank account or account log
 */
export * from "./read";
export * from "./write";
