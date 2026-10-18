/**
 * Escapes %, _, and \ so user input is matched literally inside LIKE.
 */
export const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

/**
 * True if a MySQL error is a duplicate-key violation (errno 1062), also when wrapped by Drizzle.
 *
 * Step-by-step breakdown:
 * 1. Accepts an 'unknown' error type and casts it to 'any' for inspection.
 * 2. Initializes a traversal pointer 'current' to the provided error object.
 * 3. Iterates up to 3 times to unwrap potential error layers (e.g., Drizzle wrappers).
 *    - Checks for native MySQL 'code' ("ER_DUP_ENTRY") or 'errno' (1062).
 *    - If found, immediately returns true.
 *    - Moves to the next layer via 'current.cause'.
 * 4. Returns false if no duplicate key signature is found within the chain.
 *
 * Note: This handles Drizzle's error wrapping pattern where the original DB error
 * is nested inside a 'cause' property.
 */
export function isDuplicateKey(error: unknown): boolean {
  let current: any = error;

  // Traverse up to 3 levels of error wrapping (common in ORM layers like Drizzle)
  for (let i = 0; i < 3 && current; i++) {
    // Check for standard MySQL duplicate entry indicators
    if (current.code === "ER_DUP_ENTRY" || current.errno === 1062) return true;

    // Move to the underlying cause if this layer isn't the target
    current = current.cause;
  }

  return false;
}
