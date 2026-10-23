// Metadata structure for paginated responses
export type PageMeta = {
  page: number;        // Current page number (1-indexed typically)
  per_page: number;    // Number of items returned per page
  total: number;       // Total number of items across all pages
  total_pages: number; // Calculated total number of pages
};

/**
 * Creates a successful 200 OK response with wrapped data.
 *
 * Standardizes the response shape to `{ data: T }` for consistency.
 * This wrapping pattern makes it easier to parse responses client-side
 * and distinguishes data payloads from metadata or error structures.
 *
 * @param data - The payload to return (can be any type T)
 * @returns Response with status 200 and JSON body { data }
 *
 * Example:
 * GET /api/users -> ok({ id: 1, name: "Alice" })
 * Response: { "data": { "id": 1, "name": "Alice" } }
 */
export function ok<T>(data: T): Response {
  return Response.json({ data }, { status: 200 });
}

/**
 * Creates a 201 Created response with the new resource and Location header.
 *
 * Essential for POST/PUT operations that create resources. The Location header
 * allows clients to immediately access the newly created resource without
 * performing another lookup.
 *
 * @param data - The created resource
 * @param location - Absolute or relative URL where the new resource can be accessed
 * @returns Response with status 201, JSON body { data }, and Location header
 *
 * Example:
 * POST /api/users -> created({ id: 42, name: "Bob" }, "/api/users/42")
 * Headers: { "Location": "/api/users/42" }
 * Body: { "data": { "id": 42, "name": "Bob" } }
 */
export function created<T>(data: T, location: string): Response {
  return Response.json({ data }, { status: 201, headers: { Location: location } });
}

/**
 * Creates a 204 No Content response with an empty body.
 *
 * Ideal for DELETE operations or PUT/PATCH requests where the server
 * successfully processed the request but doesn't need to return anything.
 * Reduces bandwidth by omitting the response body entirely.
 *
 * @returns Response with status 204 and null body
 *
 * Example:
 * DELETE /api/users/42 -> noContent()
 * Status: 204, Body: (empty)
 */
export function noContent(): Response {
  return new Response(null, { status: 204 });
}

/**
 * Creates a 200 OK response for collection endpoints with pagination metadata.
 *
 * Provides both the data array and pagination info in a single response.
 * Automatically calculates total_pages, ensuring it's at least 1 even when
 * total is 0 (prevents division by zero edge cases).
 *
 * @param data - Array of items for the current page
 * @param params - Pagination parameters
 * @param params.page - Current page number
 * @param params.perPage - Items per page
 * @param params.total - Total count across all pages
 * @returns Response with status 200 and JSON body { data, meta }
 *
 * Example:
 * GET /api/users?page=2&limit=10 -> paginated([...users], { page: 2, perPage: 10, total: 47 })
 * Response: {
 *   "data": [...],
 *   "meta": {
 *     "page": 2,
 *     "per_page": 10,
 *     "total": 47,
 *     "total_pages": 5
 *   }
 * }
 */
export function paginated<T>(
  data: T[],
  { page, perPage, total }: { page: number; perPage: number; total: number },
): Response {
  const meta: PageMeta = {
    page,
    per_page: perPage,
    total,
    // Ensure at least 1 page even if total is 0 (avoids 0 pages when there's data)
    total_pages: Math.max(1, Math.ceil(total / perPage)),
  };

  return Response.json({ data, meta }, { status: 200 });
}
