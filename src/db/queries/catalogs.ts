import { and, asc, count, desc, eq, inArray, like, sql, type AnyColumn } from "drizzle-orm";
import type { MySqlColumn, MySqlTable } from "drizzle-orm/mysql-core";
import { db } from "..";
import { category, color, currency, icon, language, recordType } from "../schema";
import { escapeLike } from "../utils";
import { ApiError } from "../../lib/api/errors";

/* ==========
  CATALOGS
=========== */

// Defaults given to a profile created at sign-up.
export const DEFAULT_CURRENCY = "EUR";
export const DEFAULT_LANGUAGE = "pt-PT";

type ColorRow = typeof color.$inferSelect;
type IconRow = typeof icon.$inferSelect;

/** Resolves a currency code (e.g. "EUR") to its id, or `null` when it is not supported. */
export async function findCurrencyId(code: string) {
  const [row] = await db.select({ id: currency.id }).from(currency).where(eq(currency.code, code)).limit(1);
  return row?.id ?? null;
}

/** SQL subquery giving the currency code ("EUR") of a `currency_id` column, for rows read by the API. */
export const currencyCodeOf = (currencyIdColumn: AnyColumn) =>
  sql<string>`(select ${currency.code} from ${currency} where ${currency.id} = ${currencyIdColumn})`;

/** Resolves a language code (e.g. "pt-PT") to its id, or `null` when it is not supported. */
export async function findLanguageId(code: string) {
  const [row] = await db.select({ id: language.id }).from(language).where(eq(language.code, code)).limit(1);
  return row?.id ?? null;
}

/** Same as `findCurrencyId`, but throws `422 VALIDATION_ERROR` when the code is not supported. */
export async function requireCurrencyId(code: string, pointer = "/currency") {
  const id = await findCurrencyId(code);
  if (!id) {
    throw new ApiError("VALIDATION_ERROR", "One or more fields are invalid.", [
      { pointer, message: `Unsupported currency: ${code}.` },
    ]);
  }
  return id;
}

/** Same as `findLanguageId`, but throws `422 VALIDATION_ERROR` when the code is not supported. */
export async function requireLanguageId(code: string, pointer = "/language") {
  const id = await findLanguageId(code);
  if (!id) {
    throw new ApiError("VALIDATION_ERROR", "One or more fields are invalid.", [
      { pointer, message: `Unsupported language: ${code}.` },
    ]);
  }
  return id;
}

/** Currency and language ids for a new profile. Fails loudly when the catalogs were not seeded. */
export async function getDefaultProfileCatalogIds() {
  const [currencyId, languageId] = await Promise.all([
    findCurrencyId(DEFAULT_CURRENCY),
    findLanguageId(DEFAULT_LANGUAGE),
  ]);

  if (!currencyId || !languageId) {
    throw new Error("Catalogs are empty. Run: bun run db:seed:catalogs");
  }

  return { currencyId, languageId };
}

/** Color ids by color name. Throws if any name is missing (catalogs not seeded). */
export async function getColorIdsByName(names: string[]) {
  const rows = await db.select({ id: color.id, name: color.name }).from(color).where(inArray(color.name, names));
  const map = new Map(rows.map((r) => [r.name, r.id]));
  for (const name of names) {
    if (!map.has(name)) throw new Error(`Color "${name}" not found. Run: bun run db:seed:catalogs`);
  }
  return map;
}

/** Icon ids by Material Symbols code. Throws if any code is missing (catalogs not seeded). */
export async function getIconIdsByCode(codes: string[]) {
  const rows = await db.select({ id: icon.id, code: icon.codeIcon }).from(icon).where(inArray(icon.codeIcon, codes));
  const map = new Map(rows.map((r) => [r.code, r.id]));
  for (const code of codes) {
    if (!map.has(code)) throw new Error(`Icon "${code}" not found. Run: bun run db:seed:catalogs`);
  }
  return map;
}

/** Throws `422 VALIDATION_ERROR` when the icon does not exist. */
export async function assertIconExists(iconId: string, pointer = "/icon_id") {
  const [row] = await db.select({ id: icon.id }).from(icon).where(eq(icon.id, iconId)).limit(1);
  if (!row) {
    throw new ApiError("VALIDATION_ERROR", "One or more fields are invalid.", [
      { pointer, message: "Icon does not exist." },
    ]);
  }
}

/**
 * Throws `422 VALIDATION_ERROR` when the color does not exist or is reserved.
 * For rows that may repeat a color (cards): no "in use" check, only the free palette.
 */
export async function assertColorUsable(colorId: string, pointer = "/color_id") {
  const [row] = await db
    .select({ isReserved: color.isReserved })
    .from(color)
    .where(eq(color.id, colorId))
    .limit(1);

  const message = !row ? "Color does not exist." : row.isReserved ? "This color is reserved." : null;
  if (message) {
    throw new ApiError("VALIDATION_ERROR", "One or more fields are invalid.", [{ pointer, message }]);
  }
}

/* ============
  COLOR USAGE
============= */

// A table whose rows own a color inside a dashboard (record type, category).
type ColorOwnerTable = MySqlTable & {
  id: MySqlColumn;
  dashboardId: MySqlColumn;
  colorId: MySqlColumn;
};

interface ColorUsageParams<T extends ColorOwnerTable> {
  table: T;
  dashboardId: string;
  colorId: string;
  exceptId?: string; // The row being updated, which may keep its own color
}

/**
 * Whether another row of the same dashboard already holds the color.
 * Soft-deleted rows still hold it, as the unique index (dashboard_id, color_id) does.
 */
export async function isColorTaken<T extends ColorOwnerTable>({
  table,
  dashboardId,
  colorId,
  exceptId,
}: ColorUsageParams<T>) {
  const rows = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.dashboardId, dashboardId), eq(table.colorId, colorId)))
    .limit(2);

  return rows.some((r) => String(r.id).toLowerCase() !== exceptId?.toLowerCase());
}

/**
 * Checks that a color can be given to a row.
 *
 * - `422 VALIDATION_ERROR` when the color does not exist or its reserved flag is not the expected one
 *   (`reserved: false` for ordinary rows, `reserved: true` for the seeded Income/Expenses record types).
 * - `409 COLOR_IN_USE` when another row of the dashboard already uses it.
 */
export async function assertColorAvailable<T extends ColorOwnerTable>(
  params: ColorUsageParams<T> & { reserved: boolean },
) {
  const [row] = await db
    .select({ id: color.id, isReserved: color.isReserved })
    .from(color)
    .where(eq(color.id, params.colorId))
    .limit(1);

  const fail = (message: string): never => {
    throw new ApiError("VALIDATION_ERROR", "One or more fields are invalid.", [{ pointer: "/color_id", message }]);
  };

  if (!row) fail("Color does not exist.");
  if (row && row.isReserved !== params.reserved) {
    fail(
      params.reserved
        ? "The color of Income and Expenses can only be changed to another reserved color."
        : "This color is reserved.",
    );
  }

  if (await isColorTaken(params)) throw new ApiError("COLOR_IN_USE");
}

/** Adds the `color` and `icon` rows to rows that carry `colorId` and `iconId`. */
export async function attachColorIcon<T extends { colorId: string; iconId: string }>(
  rows: T[],
): Promise<Array<T & { color: ColorRow; icon: IconRow }>> {
  if (rows.length === 0) return [];

  const colorIds = [...new Set(rows.map((r) => r.colorId))];
  const iconIds = [...new Set(rows.map((r) => r.iconId))];

  const [colors, icons] = await Promise.all([
    db.select().from(color).where(inArray(color.id, colorIds)),
    db.select().from(icon).where(inArray(icon.id, iconIds)),
  ]);

  const colorById = new Map(colors.map((c) => [c.id.toLowerCase(), c]));
  const iconById = new Map(icons.map((i) => [i.id.toLowerCase(), i]));

  return rows.map((r) => {
    const c = colorById.get(r.colorId.toLowerCase());
    const i = iconById.get(r.iconId.toLowerCase());
    if (!c || !i) throw new Error("Catalog row missing for color/icon.");
    return { ...r, color: c, icon: i };
  });
}

/* ==============
  CATALOG LISTS
=============== */

type CatalogFilters = { q?: string; sort: "name" | "-name"; limit: number; offset: number };

/**
 * Lists colors. `inUse` adds the `inUse` flag: whether the dashboard already has a record type
 * (or category) holding each color.
 */
export async function listColors(
  f: CatalogFilters & {
    isReserved?: boolean;
    inUse?: { scope: "record_type" | "category"; dashboardId: string };
  },
) {
  const where = and(
    f.q ? like(color.name, `%${escapeLike(f.q)}%`) : undefined,
    f.isReserved === undefined ? undefined : eq(color.isReserved, f.isReserved),
  );

  const rows = await db
    .select()
    .from(color)
    .where(where)
    .orderBy(f.sort === "name" ? asc(color.name) : desc(color.name), asc(color.id))
    .limit(f.limit)
    .offset(f.offset);

  const [totalRow] = await db.select({ total: count() }).from(color).where(where);

  let used: Set<string> | null = null;
  if (f.inUse) {
    const table = f.inUse.scope === "record_type" ? recordType : category;
    const usedRows = await db
      .select({ colorId: table.colorId })
      .from(table)
      .where(eq(table.dashboardId, f.inUse.dashboardId));
    used = new Set(usedRows.map((r) => r.colorId.toLowerCase()));
  }

  return {
    rows: rows.map((r) => ({ ...r, inUse: used ? used.has(r.id.toLowerCase()) : undefined })),
    total: totalRow?.total ?? 0,
  };
}

export async function listIcons(f: CatalogFilters) {
  const where = f.q ? like(icon.name, `%${escapeLike(f.q)}%`) : undefined;

  const rows = await db
    .select()
    .from(icon)
    .where(where)
    .orderBy(f.sort === "name" ? asc(icon.name) : desc(icon.name), asc(icon.id))
    .limit(f.limit)
    .offset(f.offset);

  const [totalRow] = await db.select({ total: count() }).from(icon).where(where);
  return { rows, total: totalRow?.total ?? 0 };
}

export async function listCurrencies(f: CatalogFilters) {
  const where = f.q ? like(currency.name, `%${escapeLike(f.q)}%`) : undefined;

  const rows = await db
    .select()
    .from(currency)
    .where(where)
    .orderBy(f.sort === "name" ? asc(currency.name) : desc(currency.name), asc(currency.id))
    .limit(f.limit)
    .offset(f.offset);

  const [totalRow] = await db.select({ total: count() }).from(currency).where(where);
  return { rows, total: totalRow?.total ?? 0 };
}

export async function listLanguages(f: CatalogFilters) {
  const where = f.q ? like(language.name, `%${escapeLike(f.q)}%`) : undefined;

  const rows = await db
    .select()
    .from(language)
    .where(where)
    .orderBy(f.sort === "name" ? asc(language.name) : desc(language.name), asc(language.id))
    .limit(f.limit)
    .offset(f.offset);

  const [totalRow] = await db.select({ total: count() }).from(language).where(where);
  return { rows, total: totalRow?.total ?? 0 };
}
