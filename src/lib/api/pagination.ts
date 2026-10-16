import { z } from "zod";

// Zod schema for validating and coercing pagination query parameters
const paginationSchema = z.object({
  // Coerce string input to number, enforce integer, min value 1, default to 1 if missing
  page: z.coerce.number().int().min(1).default(1),

  // Coerce string input to number, enforce integer, range [1, 100], default to 25 if missing
  per_page: z.coerce.number().int().min(1).max(100).default(25),
});

// Internal representation type used throughout the application
export type Pagination = {
  page: number;      // Current page number (1-indexed)
  perPage: number;   // Items per page (normalized camelCase)
  offset: number;    // Calculated SQL offset: (page - 1) * perPage
};

/**
 * Parses and validates pagination parameters from URL query string.
 *
 * Automatically handles:
 * - Type coercion (string "1" -> number 1)
 * - Validation (must be integers within bounds)
 * - Defaults (page=1, per_page=25 if omitted)
 * - Offset calculation for database queries
 *
 * @param searchParams - URLSearchParams instance (e.g., new URL(request.url).searchParams)
 * @returns Normalized Pagination object with validated values and calculated offset
 * @throws ZodError if parameters are invalid (automatically converted to 422 by withErrors)
 *
 * Example:
 * ?page=2&per_page=50
 * -> { page: 2, perPage: 50, offset: 50 }
 *
 * ?page=abc
 * -> throws ZodError -> 422 VALIDATION_ERROR
 *
 * (no params)
 * -> { page: 1, perPage: 25, offset: 0 }
 */
export function parsePagination(searchParams: URLSearchParams): Pagination {
  // Extract raw values, converting null (missing param) to undefined for .default() to work
  const { page, per_page } = paginationSchema.parse({
    page: searchParams.get("page") ?? undefined,
    per_page: searchParams.get("per_page") ?? undefined,
  });

  // Calculate SQL OFFSET for LIMIT/OFFSET queries: (page - 1) * per_page
  // Page 1 -> offset 0, Page 2 -> offset per_page, etc.
  return {
    page,
    perPage: per_page, // Normalize snake_case to camelCase for internal use
    offset: (page - 1) * per_page
  };
}
