import type { InferSelectModel } from "drizzle-orm";
import type { color, icon } from "../../../db/schema";

export type ColorRow = InferSelectModel<typeof color>;
export type IconRow = InferSelectModel<typeof icon>;

export function serializeColor(row: ColorRow) {
  return {
    color_id: row.id,
    name: row.name,
    code_color: row.codeColor,
  };
}

export function serializeIcon(row: IconRow) {
  return {
    icon_id: row.id,
    name: row.name,
    code_icon: row.codeIcon,
  };
}
