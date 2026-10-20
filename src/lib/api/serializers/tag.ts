import type { InferSelectModel } from "drizzle-orm";
import type { category, tag } from "../../../db/schema";
import { toIso } from "./common";

export function serializeTag(
  row: InferSelectModel<typeof tag>,
  categories?: InferSelectModel<typeof category>[],
) {
  return {
    tag_id: row.id,
    dashboard_id: row.dashboardId,
    name: row.name,
    description: row.description,
    ...(categories
      ? {
          categories: categories.map((c) => ({
            category_id: c.id,
            name: c.name,
            description: c.description,
          })),
        }
      : {}),
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  };
}
