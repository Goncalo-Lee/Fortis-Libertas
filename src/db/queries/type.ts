/* =========
  TYPES
========== */

/** Filters accepted by {@link listTags}. */
export type ListFilters = {
  /** Free-text search applied to the tag name (partial match). */
  q?: string,
  /** Sort key; a leading "-" means descending order. */
  sort: "name" | "-name" | "created_at" | "-created_at";
  /** Maximum number of rows to return (page size). */
  limit: number;
  /** Number of rows to skip (for pagination). */
  offset: number;
};
