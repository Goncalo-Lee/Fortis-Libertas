/**
 * Public entry point for record type queries and mutations.
 *
 * Import from `record-types` rather than from the individual modules:
 * - `read.ts`: reading and listing record types
 * - `write.ts`: creating, updating and soft-deleting record types
 * - `types.ts`: input types shared by the modules
 */
export * from "./read";
export * from "./write";
export * from "./type";
