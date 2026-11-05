/**
 * Financial history of a dashboard (endpoints.md, section 20).
 * - `write.ts`: sync functions called by the source queries inside their transactions (no public write endpoint)
 * - `read.ts`: the paginated list
 */
export * from "./read";
export * from "./write";
export * from "./type";
