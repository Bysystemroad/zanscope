import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isEmailVerified } from "@/lib/auth-security";
import { sessionLoopTrace } from "@/lib/session-loop-trace";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const host = request.nextUrl.hostname;
  const { pathname } = request.nextUrl;
  const authCookieNames = request.cookies
    .getAll()
    .map((cookie) => cookie.name)
    .filter((name) => name.startsWith("sb-") || name.includes("supabase"));

  if (!supabaseUrl || !supabaseAnonKey) {
    sessionLoopTrace("middleware.env_missing", {
      host,
      pathname,
      authCookieCount: authCookieNames.length
    });
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (host === "zanscope.com") {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.hostname = "www.zanscope.com";

    sessionLoopTrace("middleware.redirect", {
      host,
      pathname,
      authCookieCount: authCookieNames.length,
      userId: user?.id || null,
      emailVerified: user ? isEmailVerified(user) : false,
      destination: canonicalUrl.toString(),
      reason: "canonical_www",
      cookiesCopied: response.cookies.getAll().length
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
  const hasVerifiedUser = Boolean(user && isEmailVerified(user));

  sessionLoopTrace("middleware.auth_result", {
    host,
    pathname,
    authCookieCount: authCookieNames.length,
    getUserError: error?.message || null,
    userId: user?.id || null,
    hasUser: Boolean(user),
    emailVerified: user ? isEmailVerified(user) : false,
    redirectDecision: isAuthPage && hasVerifiedUser ? "dashboard" : isProtectedPage && !hasVerifiedUser ? "login" : "next",
    cookiesCopied: response.cookies.getAll().length
  });

  if (isAuthPage && hasVerifiedUser) {
    const destination = new URL("/dashboard", request.url);
    sessionLoopTrace("middleware.redirect", {
      host,
      pathname,
      authCookieCount: authCookieNames.length,
      userId: user?.id || null,
      emailVerified: user ? isEmailVerified(user) : false,
      destination: destination.toString(),
      reason: "verified_user_on_login",
      cookiesCopied: response.cookies.getAll().length
    });
    return redirectWithAuthCookies(destination, response);
  }

  if (isProtectedPage && !hasVerifiedUser) {
    const destination = new URL("/login", request.url);
    sessionLoopTrace("middleware.redirect", {
      host,
      pathname,
      authCookieCount: authCookieNames.length,
      userId: user?.id || null,
      emailVerified: user ? isEmailVerified(user) : false,
      destination: destination.toString(),
      reason: "missing_verified_session",
      cookiesCopied: response.cookies.getAll().length
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
