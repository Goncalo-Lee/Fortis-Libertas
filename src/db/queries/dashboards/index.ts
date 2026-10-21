/**
 * Public entry point for dashboard queries and mutations.
 *
 * Import from `dashboards` rather than from the individual modules:
 * - `types.ts`: `Role` and `ListFilters` types
 * - `read.ts`: reading and listing dashboards and memberships
 * - `write.ts`: creating, updating, soft-deleting and restoring dashboards
 */
export * from "./type";
export * from "./read";
export * from "./write";
