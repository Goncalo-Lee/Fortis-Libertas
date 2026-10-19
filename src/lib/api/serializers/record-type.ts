import type { InferSelectModel } from "drizzle-orm";
import { type recordType } from "../../../db/schema";
import { toIso } from "./common";

/**
 * Serializes a Drizzle `recordType` row into a plain, API-friendly object.
 *
 * Step-by-step breakdown:
 * 1. Takes a typed row inferred from the Drizzle schema (`InferSelectModel`),
 *    so column names/types stay in sync with the DB definition.
 * 2. Maps snake_case DB columns to camelCase domain fields:
 *    - `row.id`            -> `record_type_id`
 *    - `row.dashboardId`   -> `dashboard_id`
 *    - `row.name`          -> `name`
 *    - `row.description`   -> `description`
 * 3. Converts timestamp columns to ISO strings via `toIso(...)`:
 *    - `row.createdAt` -> `created_at`
 *    - `row.updatedAt` -> `updated_at`
 * 4. Returns a flat object suitable for JSON responses.
 */
export function serializeRecordType(row: InferSelectModel<typeof recordType>) {
  return {
    // Map primary key from Drizzle field to the API's expected snake_case key
    record_type_id: row.id,

    // Foreign key back to the owning dashboard
    dashboard_id: row.dashboardId,

    // Passthrough scalar fields
    name: row.name,
    description: row.description,

    // Normalize timestamps to ISO 8601 strings for transport
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  };
}
