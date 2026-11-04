/**
 * Reads a multi-value query parameter. Accepts repeats (`?status=a&status=b`) and commas (`?status=a,b`),
 * and ignores empty entries.
 */
export function getMulti(searchParams: URLSearchParams, key: string): string[] {
  return searchParams
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}
