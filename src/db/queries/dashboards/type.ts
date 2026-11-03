import { ListFilters } from "../type";

/**
 * Role a user can have within a dashboard.
 *
 * @property `owner`: full control, including managing members and deleting the dashboard
 * @property `editor`: can modify the dashboard's content
 * @property `viewer`: read-only access
 */
export type Role = "owner" | "editor" | "viewer";

/**
 * Query filters accepted by `listDashboards`.
 *
 * @property is_active - Optional filter on the dashboard's active status
 * @property role - Optional filter on the requesting user's role in the dashboard
 * @property q - Optional partial match on the dashboard name
 * @property sort - Ordering of the results. A leading `-` means descending order
 * @property limit - Maximum number of rows to return
 * @property offset - Number of rows to skip before returning results
 * @property deleted - When `true`, returns only soft-deleted dashboards (owners only)
 */
export type ListFiltersDashboards =
  ListFilters & {
    is_active?: boolean;
    role?: Role;
    deleted?: boolean;
  };

export interface CreateDashboardInput {
    name: string;
    isActive?: boolean;
}

export interface UpdateDashboardInput {
    name?: string;
    isActive?: boolean;
}

export interface ListDashboardsFilter {
    isActive?: boolean;
    deleted?: boolean;
    q?: string;
}