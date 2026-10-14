import { ZodError } from "zod";

// Centralized error codes with consistent HTTP status mapping
export type ErrorCode =
  | "MALFORMED_REQUEST"        // 400 - Invalid request structure
  | "UNAUTHENTICATED"          // 401 - Missing/invalid credentials
  | "ACCOUNT_SUSPENDED"        // 403 - Account disabled
  | "FORBIDDEN"                // 403 - Insufficient permissions
  | "NOT_FOUND"                // 404 - Resource doesn't exist
  | "NAME_ALREADY_EXISTS"      // 409 - Conflict: duplicate name
  | "USER_NAME_TAKEN"          // 409 - Conflict: username taken
  | "ALREADY_MEMBER"           // 409 - Conflict: user already member
  | "LAST_OWNER"               // 409 - Conflict: can't transfer ownership if last owner
  | "IN_USE"                   // 409 - Conflict: resource currently in use
  | "HAS_ACTIVE_CARDS"         // 409 - Conflict: can't delete with active cards
  | "MEMBER_HAS_CARDS"         // 409 - Conflict: can't remove member with cards
  | "DASHBOARD_INACTIVE"       // 409 - Conflict: dashboard not active
  | "PLAN_CANCELLED"           // 409 - Conflict: subscription cancelled
  | "CURRENT_SESSION"          // 409 - Conflict: operation affects current session
  | "VALIDATION_ERROR"         // 422 - Schema validation failed
  | "RATE_LIMITED"             // 429 - Too many requests
  | "INTERNAL_ERROR";          // 500 - Unexpected server error

// Maps each error code to its appropriate HTTP status code
const STATUS: Record<ErrorCode, number> = {
  MALFORMED_REQUEST: 400,
  UNAUTHENTICATED: 401,
  ACCOUNT_SUSPENDED: 403,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  NAME_ALREADY_EXISTS: 409,
  USER_NAME_TAKEN: 409,
  ALREADY_MEMBER: 409,
  LAST_OWNER: 409,
  IN_USE: 409,
  HAS_ACTIVE_CARDS: 409,
  MEMBER_HAS_CARDS: 409,
  DASHBOARD_INACTIVE: 409,
  PLAN_CANCELLED: 409,
  CURRENT_SESSION: 409,
  VALIDATION_ERROR: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

// Structured field errors for validation failures
export type FieldError = {
  pointer: string;   // JSON Pointer path to invalid field (e.g., "/email")
  message: string;   // Human-readable validation message
};

// Custom error class extending Error with HTTP status and structured details
export class ApiError extends Error {
  readonly status: number;          // HTTP status code derived from ErrorCode

  constructor(
    readonly code: ErrorCode,       // Machine-readable error identifier
    readonly detail?: string,       // Optional human-readable explanation
    readonly errors?: FieldError[], // Optional array of field-specific validation errors
  ) {
    super(detail ?? code);          // Fallback to error code if no detail provided
    this.status = STATUS[code];     // Auto-map to correct HTTP status
  }
}

// Helper to create RFC 7807 Problem Details JSON response
function problem(status: number, code: ErrorCode, detail?: string, errors?: FieldError[]) {
  const body = {
    type: `https://fortis-libertas.local/error/${code.toLowerCase().replaceAll("_", "-")}`,
    // Unique URI identifying the error type (for documentation/machine reading)

    title: code,              // Short, machine-readable error code
    status,                   // HTTP status code
    code,                     // Duplicate of title for clarity

    ...(detail && { detail }),      // Conditional: include detail if provided
    ...(errors && { errors }),      // Conditional: include field errors if provided
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/problem+json" },
    // Standard MIME type for Problem Details (RFC 7807)
  });
}

// Converts any thrown error into a standardized Problem Details response
function toProblem(error: unknown): Response {
  // Handle custom API errors
  if (error instanceof ApiError) {
    return problem(error.status, error.code, error.detail, error.errors);
  }

  // Handle Zod validation errors specifically
  if (error instanceof ZodError) {
    const errors = error.issues.map((issue) => ({
      pointer: "/" + issue.path.join("/"),  // Convert Zod path to JSON Pointer
      message: issue.message,
    }));
    return problem(422, "VALIDATION_ERROR", "One or more fields are invalid.", errors);
  }

  // Catch-all for unexpected errors - log internally but don't expose details
  console.error(error); // Log full error to server logs for debugging
  return problem(500, "INTERNAL_ERROR"); // Return generic error to client
}

/**
 * Middleware wrapper for API route handlers.
 * Automatically catches thrown errors and converts them to Problem Details responses.
 *
 * @param handler - The original route handler function
 * @returns Wrapped handler with automatic error-to-response conversion
 *
 * Usage example:
 * export const POST = withErrors(async (request: Request) => {
 *   if (!isValid) throw new ApiError("MALFORMED_REQUEST");
 *   // ... rest of handler
 * });
 */
export function withErrors<Req extends Request, Ctx>(
  handler: (request: Req, ctx: Ctx) => Promise<Response>,
) {
  return async (request: Req, ctx: Ctx): Promise<Response> => {
    try {
      return await handler(request, ctx);
    } catch (error) {
      return toProblem(error); // Convert any thrown error to proper HTTP response
    }
  };
}
