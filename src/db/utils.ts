/**
 * Escapes % and _ so user input is matched literally inside LIKE.
 */
export const escapeLike = (value: string) => value.replace(/[\\%_]/, "\\$&");

/**
 * True if a MySQL error is a duplicate-key violation (errno 1062), also when wrapped by Drizzle.
 */
export function isDuplicateKey(error: unknown): boolean {

  let current: any = error;

  for (let i = 0; i < 3 && current; i++) {
    if (current.code === "ER_DUP_ENTRY" || current.errno === 1062) return true;
    current = current.cause;
  }

  return false;
}
