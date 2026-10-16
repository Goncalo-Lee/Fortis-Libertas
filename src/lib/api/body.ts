import type { ZodType } from "zod";
import { ApiError } from "./errors";

/**
 * Parses and validates a JSON request body against a Zod schema.
 *
 * Consolidates the two failure modes of body handling into distinct,
 * semantically correct HTTP errors:
 *
 * 1. Malformed JSON (unparseable)      -> 400 MALFORMED_REQUEST
 * 2. Structurally valid but wrong shape -> 422 VALIDATION_ERROR
 *
 * This distinction matters: a client sending garbage bytes gets a different
 * signal than a client sending well-formed JSON with an invalid field.
 *
 * @param request - Incoming Request object
 * @param schema - Zod schema describing the expected body shape
 * @returns Parsed and validated value, typed as T
 * @throws ApiError("MALFORMED_REQUEST") if body isn't valid JSON
 * @throws ZodError if body fails schema validation (-> 422 via withErrors)
 *
 * Example:
 * const body = await parseJson(request, updateProfileSchema);
 * // body is fully typed and validated
 */
export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  // Declare outside try so it's accessible after the catch block scope
  let body: unknown;

  try {
    // request.json() throws SyntaxError on malformed input.
    // Note: this also consumes the body stream — it can only be called once.
    body = await request.json();
  } catch {
    // Swallow the raw SyntaxError (which may contain parser internals)
    // and surface a clean, actionable 400 instead.
    throw new ApiError("MALFORMED_REQUEST", "Request body must be valid JSON.");
  }

  // Validate the parsed body. A ZodError propagates up and is converted
  // to a 422 VALIDATION_ERROR with field-level pointers by withErrors.
  return schema.parse(body);
}
