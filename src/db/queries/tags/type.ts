import { type ListFilters } from "../type";

/* =========
  TYPES
========== */

/**
 * Query filters accepted by `listCategories`.
 *
 * @property q - Optional partial match on the category name
 * @property categoryId - Optional category ID; only tags linked to this category are returned
 * @property sort - Ordering of the results. A leading `-` means descending order
 * @property limit - Maximum number of rows to return
 * @property offset - Number of rows to skip before returning results
 */
export type ListFiltersTag =
  ListFilters
  & {
    categoryId?: string;
  };

export interface CreateTagInput {
    name: string;
    description?: string | null;
}

export interface UpdateTagInput {
    name?: string;
    description?: string | null;
}
