/**
 * Public entry point for category queries and mutations.
 *
 * Import from `categories` rather than from the individual modules:
 * - `read.ts`: reading and listing categories
 * - `write.ts`: creating, updating and soft-deleting categories
 * - `relation.ts`: linking categories to tags
 */
export * from "./read";
export * from "./write";
export * from "./relations";
