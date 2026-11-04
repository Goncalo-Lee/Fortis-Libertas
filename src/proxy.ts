import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth"; // Adjust this path to where your Better Auth instance is exported

export async function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // 1. Get session natively using Better Auth
  const session = await auth.api.getSession({
    headers: await headers(), // Ensure we pass the headers to read the cookie
  });

  const userRole = session?.user?.role; // 'admin' | 'user' | undefined
  const isAuthenticated = !!session;

  // 2. Define route groups
  const isAuthRoute = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isAdminRoute = pathname.startsWith("/admin");
  const isUserRoute = pathname.startsWith("/dashboard");

  // 3. Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    const redirectUrl = userRole === "admin" ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(redirectUrl, origin));
  }

  // 4. Protect Admin routes (Block unauthenticated and normal users)
  if (isAdminRoute) {
    if (!isAuthenticated) return NextResponse.redirect(new URL("/sign-in", origin));
    if (userRole !== "admin") return NextResponse.redirect(new URL("/dashboard", origin));
  }

  // 5. Protect User routes (Block unauthenticated and admins)
  if (isUserRoute) {
    if (!isAuthenticated) return NextResponse.redirect(new URL("/sign-in", origin));
    if (userRole === "admin") return NextResponse.redirect(new URL("/admin/dashboard", origin));
  }

  return NextResponse.next();
}

// 6. Optimize proxy to run only on relevant paths
export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$).*)",
  ],
};