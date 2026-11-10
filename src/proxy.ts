import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // 1. Get session natively using Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAuthenticated = !!session;
  const userRole = session?.user?.role; // 'admin' | 'user' | undefined

  // VERIFICA SE O EMAIL FOI VALIDADO
  const isEmailVerified = session?.user?.emailVerified === true;

  // 2. Define route groups
  const isAuthRoute = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isAdminRoute = pathname.startsWith("/admin");
  const isUserRoute = pathname.startsWith("/dashboard");

  // 3. Redirect authenticated AND verified users away from auth pages
  if (isAuthRoute && isAuthenticated && isEmailVerified) {
    const redirectUrl = userRole === "admin" ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(redirectUrl, origin));
  }

  // Se o utilizador está logado mas o email NÃO está verificado, podes opcionalmente
  // bloqueá-lo de entrar na app e redirecioná-lo para um aviso (opcional, mas recomendado)
  if ((isAdminRoute || isUserRoute) && isAuthenticated && !isEmailVerified) {
    // Podes criar uma página do tipo /verify-email-notice ou deslogar
    // Por segurança, mandamos para o sign-in com aviso ou limpamos a sessão
    return NextResponse.redirect(new URL("/sign-in?not_verified=true", origin));
  }

  // 4. Protect Admin routes (Block unauthenticated, non-verified and normal users)
  if (isAdminRoute) {
    if (!isAuthenticated || !isEmailVerified) return NextResponse.redirect(new URL("/sign-in", origin));
    if (userRole !== "admin") return NextResponse.redirect(new URL("/dashboard", origin));
  }

  // 5. Protect User routes (Block unauthenticated, non-verified and admins)
  if (isUserRoute) {
    if (!isAuthenticated || !isEmailVerified) return NextResponse.redirect(new URL("/sign-in", origin));
    if (userRole === "admin") return NextResponse.redirect(new URL("/admin/dashboard", origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$).*)",
  ],
};  