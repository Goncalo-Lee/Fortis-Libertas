import type { InferSelectModel } from "drizzle-orm";
import type { tag } from "../../../db/schema";
import { toIso } from "./common";

export function serializeTag(row: InferSelectModel<typeof tag>) {
  return {
    tag_id: row.id,
    dashboard_id: row.dashboardId,
    name: row.name,
    description: row.description,
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  };
}
