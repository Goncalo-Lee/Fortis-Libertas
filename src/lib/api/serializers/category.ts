import type { InferSelectModel } from "drizzle-orm";
import type { category, recordType, tag } from "../../../db/schema";
import { serializeColor, serializeIcon, type ColorRow, type IconRow } from "./catalog";
import { toIso } from "./common";
import { serializeTag } from "./tag";

type WithCatalogs<T> = T & { color: ColorRow; icon: IconRow };

/**
 * Category representation. `record_types` is always present; `tags` only when the caller
 * passes them (`include=tags`).
 */
export function serializeCategory(
  row: WithCatalogs<InferSelectModel<typeof category>>,
  recordTypes: WithCatalogs<InferSelectModel<typeof recordType>>[],
  tags?: InferSelectModel<typeof tag>[],
) {
  return {
    category_id: row.id,
    dashboard_id: row.dashboardId,
    name: row.name,
    description: row.description,
    color_id: row.colorId,
    color: serializeColor(row.color),
    icon_id: row.iconId,
    icon: serializeIcon(row.icon),
    ...(tags ? { tags: tags.map((t) => serializeTag(t)) } : {}),
    record_types: recordTypes.map((rt) => ({
      record_type_id: rt.id,
      name: rt.name,
      color: serializeColor(rt.color),
      icon: serializeIcon(rt.icon),
    })),
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
  };
}
