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
export interface ListFiltersCategory {
    q?: string;
    tagId?: string;
    sort?: "name" | "-name" | "created_at" | "-created_at";
    limit?: number;
    offset?: number;
    includeTags?: boolean;
}

export interface CreateCategoryInput {
    name: string;
    description?: string | null;
    tagIds?: string[];
}

export interface UpdateCategoryInput {
    name?: string;
    description?: string | null;
}

