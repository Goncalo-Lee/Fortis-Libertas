import type { ListFilters } from "../type";

/* ======
  TYPE
======= */

/** Filters of `listCategories`: the common list filters plus the category-specific ones. */
export type ListFiltersCategory = ListFilters & {
  /** Only categories linked to this tag */
  tagId?: string;
  /** Only categories usable with this record type */
  recordTypeId?: string;
};

export interface CreateCategoryInput {
  name: string;
  description?: string | null;
  tagIds?: string[];
  colorId: string;
  iconId: string;
  recordTypeIds: string[];
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  colorId?: string;
  iconId?: string;
}
