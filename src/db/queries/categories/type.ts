import { type ListFilters } from "../type";

/* ======
  TYPE
======= */

/**
 * Query filters accepted by `listCategories`.
 *
 * @property q - Optional partial match on the category name
 * @property tagId - Optional tag ID; only categories linked to this tag are returned
 * @property sort - Ordering of the results. A leading `-` means descending order
 * @property limit - Maximum number of rows to return
 * @property offset - Number of rows to skip before returning results
 */
export type ListFiltersCategory =
  ListFilters
  & {
    tagId?: string;
  };
