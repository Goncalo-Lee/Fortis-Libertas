import type { ListActivityLogsFilters } from "@/db/queries/activity-logs";
import { parsePagination } from "./pagination";
import { getMulti } from "./query";
import { activityLogMultiQuery, listActivityLogsQuery } from "./schemas/activity-log";

/**
 * Reads the query string shared by the three activity log lists (endpoints.md, section 19.3):
 * pagination, `action` (multi), `entity_type`, `user_id`, `created_from`/`created_to` and `sort`.
 *
 * @param options.allowUserFilter - `false` for GET /me/activity-logs, where every entry is the caller's anyway
 * @throws ZodError -> 422 through withErrors
 */
export function readActivityLogQuery(searchParams: URLSearchParams, { allowUserFilter = true } = {}) {
  const { page, perPage, offset } = parsePagination(searchParams);
  const f = listActivityLogsQuery.parse(Object.fromEntries(searchParams));
  const { action } = activityLogMultiQuery.parse({ action: getMulti(searchParams, "action") });

  const filters: ListActivityLogsFilters = {
    actions: action,
    entityType: f.entity_type,
    userId: allowUserFilter ? f.user_id : undefined,
    createdFrom: f.created_from,
    createdTo: f.created_to,
    sort: f.sort,
    limit: perPage,
    offset,
  };
  return { page, perPage, filters };
}
