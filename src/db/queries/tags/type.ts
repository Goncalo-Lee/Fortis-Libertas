import { type ListFilters } from "../type";

/* =========
  TYPES
========== */

export type ListFiltersTag =
  ListFilters
  & {
    /** Only return tags linked to this category. */
    categoryId?: string;
  };
