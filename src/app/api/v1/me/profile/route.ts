import type { NextRequest } from "next/server";
import { getOrCreateProfile, updateProfile } from "@/db/queries/me";
import { requireSession } from "@/lib/api/auth";
import { parseJson } from "@/lib/api/body";
import { withErrors } from "@/lib/api/errors";
import { ok } from "@/lib/api/responses";
import { updateProfileSchema } from "@/lib/api/schemas/profile";
import { serializeProfile } from "@/lib/api/serializers/user";

// Force Node.js runtime — required for the MySQL driver (net/tls sockets),
// which cannot run in Next.js's Edge Runtime.
export const runtime = "nodejs";

/**
 * GET /api/profile
 *
 * Returns the authenticated user's profile.
 *
 * Pipeline: requireSession -> getOrCreateProfile -> serializeProfile -> ok
 *
 * Note: Uses getOrCreateProfile (not a plain fetch) so the endpoint is
 * self-healing — a user whose signup hook failed still gets a valid profile
 * rather than a 404.
 *
 * Errors:
 * - 401 UNAUTHENTICATED / 403 ACCOUNT_SUSPENDED (from requireSession)
 * - 500 INTERNAL_ERROR (unexpected failures via withErrors)
 */
export const GET = withErrors(async (request: NextRequest) => {
  // Authenticate; throws ApiError on invalid session/deleted/suspended user
  const { user } = await requireSession(request);

  // Fetch-or-create, then shape for the API contract.
  // Only the profile is returned here (user data lives at /api/me).
  return ok(serializeProfile(await getOrCreateProfile(user.id)));
});

/**
 * PATCH /api/profile
 *
 * Partially updates the authenticated user's profile.
 *
 * Pipeline: requireSession -> parseJson(+schema) -> updateProfile -> serializeProfile -> ok
 *
 * The schema guarantees at least one field is present, so we never reach
 * the DB layer with an empty payload (which would be a pointless no-op).
 *
 * Side effects handled in updateProfile:
 * - Changing `phone` clears `phoneVerifiedAt` (re-verification required)
 * - `updatedAt` is bumped only when real changes occur
 *
 * Errors:
 * - 401 UNAUTHENTICATED / 403 ACCOUNT_SUSPENDED (from requireSession)
 * - 400 MALFORMED_REQUEST (invalid JSON, from parseJson)
 * - 422 VALIDATION_ERROR (schema mismatch, from parseJson/Zod)
 * - 500 INTERNAL_ERROR (unexpected failures via withErrors)
 *
 * @returns 200 with the freshly-updated profile
 */
export const PATCH = withErrors(async (request: NextRequest) => {
  // Step 1: Authenticate
  const { user } = await requireSession(request);

  // Step 2: Parse + validate body.
  // `changes` is typed as the inferred schema output (snake_case keys).
  // Throws ApiError(400) for bad JSON, ZodError(->422) for schema violations.
  const changes = await parseJson(request, updateProfileSchema);

  // Step 3: Apply changes, then return the fresh state.
  // updateProfile handles snake_case -> camelCase mapping and business rules.
  return ok(serializeProfile(await updateProfile(user.id, changes)));
});
