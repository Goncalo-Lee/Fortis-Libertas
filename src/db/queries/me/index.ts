/**
 * Public entry point for profile queries and mutations.
 *
 * Import from `me` rather than from the individual modules:
 * - `read.ts`: reading the current user and their profile
 * - `write.ts`: updating profile fields
 * - `types.ts`: shared input types
 */
export * from "./read";
export * from "./write";
export * from "./type";
