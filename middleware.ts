import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";
import { isEmailVerified } from "@/lib/auth-security";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createMiddlewareClient({ req: request, res: response });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const isSearchDemoPage = pathname === "/search/results" && request.nextUrl.searchParams.get("demo") === "true";
  const isProtectedPage =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/billing" ||
    (pathname.startsWith("/search/") && !isSearchDemoPage);
  const hasVerifiedSession = Boolean(session && isEmailVerified(session.user));

  if (process.env.NODE_ENV === "development" && (isLoginPage || isProtectedPage)) {
    console.debug("[auth middleware] session check", {
      pathname,
      hasSession: Boolean(session),
      hasVerifiedSession
    });
  }

  if (isLoginPage && hasVerifiedSession) {
    return redirectWithAuthCookies(new URL("/dashboard", request.url), response);
  }

  if (isProtectedPage && !hasVerifiedSession) {
    return redirectWithAuthCookies(new URL("/login", request.url), response);
  }

  return response;
}

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/billing", "/search/:path*"]
};

function redirectWithAuthCookies(url: URL, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}
