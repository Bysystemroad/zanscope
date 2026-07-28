import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";
import { authTrace } from "@/lib/auth-trace";
import { isEmailVerified } from "@/lib/auth-security";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const host = request.nextUrl.hostname;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createMiddlewareClient({ req: request, res: response });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;
  if (host === "zanscope.com") {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.hostname = "www.zanscope.com";

    authTrace("middleware.redirect", {
      pathname,
      userId: session?.user.id || null,
      emailVerified: session?.user ? isEmailVerified(session.user) : false,
      destination: canonicalUrl.toString(),
      reason: "canonical_www",
      refreshedCookies: response.cookies.getAll().length
    });

    return redirectWithAuthCookies(canonicalUrl, response);
  }

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isSearchDemoPage = pathname === "/search/results" && request.nextUrl.searchParams.get("demo") === "true";
  const isProtectedPage =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/billing" ||
    pathname === "/new-search" ||
    pathname === "/saved-leads" ||
    pathname === "/lists" ||
    pathname.startsWith("/lists/") ||
    (pathname.startsWith("/search/") && !isSearchDemoPage);
  const hasVerifiedSession = Boolean(session && isEmailVerified(session.user));

  authTrace("middleware.session_check", {
    pathname,
    userId: session?.user.id || null,
    hasSession: Boolean(session),
    hasVerifiedSession,
    emailVerified: session?.user ? isEmailVerified(session.user) : false,
    refreshedCookies: response.cookies.getAll().length,
    response: isAuthPage && hasVerifiedSession ? "redirect" : isProtectedPage && !hasVerifiedSession ? "redirect" : "next"
  });

  if (isAuthPage && hasVerifiedSession) {
    const destination = new URL("/dashboard", request.url);
    authTrace("middleware.redirect", {
      pathname,
      userId: session?.user.id || null,
      emailVerified: session?.user ? isEmailVerified(session.user) : false,
      destination: destination.toString(),
      reason: "verified_user_on_login",
      refreshedCookies: response.cookies.getAll().length
    });
    return redirectWithAuthCookies(destination, response);
  }

  if (isProtectedPage && !hasVerifiedSession) {
    const destination = new URL("/login", request.url);
    authTrace("middleware.redirect", {
      pathname,
      userId: session?.user.id || null,
      emailVerified: session?.user ? isEmailVerified(session.user) : false,
      destination: destination.toString(),
      reason: "missing_verified_session",
      refreshedCookies: response.cookies.getAll().length
    });
    return redirectWithAuthCookies(destination, response);
  }

  return response;
}

export const config = {
  matcher: ["/login", "/signup", "/dashboard/:path*", "/billing", "/search/:path*", "/new-search", "/saved-leads", "/lists/:path*"]
};

function redirectWithAuthCookies(url: URL, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}
