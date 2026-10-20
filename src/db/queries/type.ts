/* =========
  TYPES
========== */

/**
 * Query filters accepted by `listCategories`.
 *
 * @property q - Optional partial match on the category name
 * @property sort - Ordering of the results. A leading `-` means descending order
 * @property limit - Maximum number of rows to return
 * @property offset - Number of rows to skip before returning results
 */
export type ListFilters = {
  q?: string,
  sort: "name" | "-name" | "created_at" | "-created_at";
  limit: number;
  offset: number;
};
