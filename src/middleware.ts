import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

/**
 * Middleware for route protection and authentication
 *
 * This runs on every request and can:
 * 1. Protect routes that require authentication
 * 2. Redirect unauthenticated users to sign in
 * 3. Add custom headers
 * 4. Implement rate limiting (if configured)
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Public routes that don't require authentication
  // Uncomment if you need to check public routes
  // const publicRoutes = ["/", "/auth/signin", "/auth/signup", "/api/auth"];
  // const isPublicRoute = publicRoutes.some((route) =>
  //   pathname.startsWith(route)
  // );

  // API routes that require authentication
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Protected app routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Admin-only routes
    if (pathname.startsWith("/admin") && req.auth?.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && pathname.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

/**
 * Matcher configuration
 * Specify which routes this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
