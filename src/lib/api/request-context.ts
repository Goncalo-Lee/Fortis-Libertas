import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Information about the request being handled, available anywhere below the route without passing it as a parameter.
 *
 * Why: the activity log needs to know WHO did an action and from WHERE (IP, user agent), but the write queries
 * (`createCategory`, `updateTag`, ...) only receive the data they change. Instead of adding an `actorId` parameter
 * to every query and every route, the request keeps this information in an AsyncLocalStorage "box":
 *
 * 1. `withErrors` opens the box for each request (`runWithRequestContext`) with the IP and user agent.
 * 2. `requireSession` puts the authenticated user in it (`setRequestUser`).
 * 3. `logActivity` reads it (`getRequestContext`) when it writes an entry.
 *
 * Each request has its own box, even when many run at the same time: Node keeps it attached to the async calls
 * of that request. Next.js uses the same mechanism for `headers()` and `cookies()`.
 */
export type RequestContext = {
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
};

const storage = new AsyncLocalStorage<RequestContext>();

/** Client IP: the first address of `x-forwarded-for` (set by proxies), then `x-real-ip`. */
export function clientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || headers.get("x-real-ip") || null)?.slice(0, 45) ?? null; // 45 = longest IPv6 text form
}

/** Runs `fn` with a fresh context for this request. Called once per request by `withErrors`. */
export function runWithRequestContext<T>(request: Request, fn: () => Promise<T>) {
  return storage.run(
    { userId: null, ipAddress: clientIp(request.headers), userAgent: request.headers.get("user-agent") },
    fn,
  );
}

/** Records the authenticated user of the current request. Called by `requireSession`. */
export function setRequestUser(userId: string) {
  const context = storage.getStore();
  if (context) context.userId = userId;
}

/** The current request's context, or `undefined` outside a request (scripts, seeds). */
export function getRequestContext() {
  return storage.getStore();
}
