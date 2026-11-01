/* =========
  TYPES
========== */

/**
 * Query filters accepted by `ListFilters`.
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

/**
 * Role a user can have within a dashboard.
 *
 * @property `owner`: full control, including managing members and deleting the dashboard
 * @property `editor`: can modify the dashboard's content
 * @property `viewer`: read-only access
 */
export type Role = "owner" | "editor" | "viewer";
