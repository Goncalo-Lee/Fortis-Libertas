/**
 * Public entry point for category queries and mutations.
 *
 * Import from `tags` rather than from the individual modules:
 * - `read.ts`: reading and listing tags
 * - `write.ts`: creating, updating and soft-deleting tags
 * - `relation.ts`: linking tags to categories
 */
export * from "./read";
export * from "./write";
export * from "./relations";
