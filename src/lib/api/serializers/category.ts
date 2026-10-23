import type { InferSelectModel } from "drizzle-orm";
import type { category, tag } from "../../../db/schema";
import { toIso } from "./common";
import { serializeTag } from "./tag";

export function serializeCategory(
  row: InferSelectModel<typeof category>,
  tags?: InferSelectModel<typeof tag>[],
) {
  return {
    category_id: row.id,
    dashboard_id: row.dashboardId,
    name: row.name,
    description: row.description,
    ...(tags ? { tags: tags.map((t) => serializeTag(t)) } : {}),
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  };
}
