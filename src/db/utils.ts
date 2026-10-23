/**
 * Escapes %, _, and \ so user input is matched literally inside LIKE.
 */
export const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");
