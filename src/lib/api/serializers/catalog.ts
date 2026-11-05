import type { InferSelectModel } from "drizzle-orm";
import type { color, currency, icon, language } from "../../../db/schema";

export type ColorRow = InferSelectModel<typeof color>;
export type IconRow = InferSelectModel<typeof icon>;

export function serializeColor(row: ColorRow) {
  return {
    color_id: row.id,
    name: row.name,
    code_color: row.codeColor,
    // The two colors of Income and Expenses: other record types and categories cannot use them.
    is_reserved: row.isReserved,
  };
}

export function serializeIcon(row: IconRow) {
  return {
    icon_id: row.id,
    name: row.name,
    code_icon: row.codeIcon,
  };
}

export function serializeCurrency(row: InferSelectModel<typeof currency>) {
  return { currency_id: row.id, code: row.code, name: row.name, symbol: row.symbol };
}

export function serializeLanguage(row: InferSelectModel<typeof language>) {
  return { language_id: row.id, code: row.code, name: row.name };
}
