import { auth } from "../auth";
import { ApiError } from "./errors";

/**
 * Middleware to enforce authentication and account status checks.
 *
 * Validates the incoming request against the auth provider (checking cookies
 * or Bearer tokens) and ensures the user account is active and not deleted.
 *
 * @param request - The incoming Request object containing headers
 * @returns The validated session object { session, user }
 * @throws ApiError("UNAUTHENTICATED", 401) if:
 *   - No valid session/token found
 *   - User account is soft-deleted (deletedAt is set)
 * @throws ApiError("ACCOUNT_SUSPENDED", 403) if:
 *   - User account is suspended (suspendedAt is set)
 *
 * Note: This function does NOT check specific permissions (scopes/roles).
 * It only verifies identity and account health. Use separate permission checks
 * for authorization logic.
 */
export async function requireSession(request: Request) {
  // Retrieve session from auth provider using request headers (cookies/auth header)
  const session = await auth.api.getSession({ headers: request.headers });

  // Check 1: Session existence AND user soft-delete status
  // Soft-deleted users (deletedAt !== null) are treated as non-existent for auth purposes
  if (!session || session.user.deletedAt) {
    throw new ApiError("UNAUTHENTICATED");
  }

  // Check 2: Account suspension status
  // Suspended users (suspendedAt !== null) are blocked even if they have a valid token
  if (session.user.suspendedAt) {
    throw new ApiError("ACCOUNT_SUSPENDED");
  }

  // Return the full session object if all checks pass
  // Structure depends on auth lib, typically: { session: {...}, user: {...} }
  return session;
}
