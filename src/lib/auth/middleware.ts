import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "./constants";

export async function authMiddleware(request: NextRequest) {
  if (process.env.BIBLIOSCAN_DEV_MODE === "true") {
    return NextResponse.next({ request });
  }

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute =
    isAuthRoute ||
    request.nextUrl.pathname === "/api/health" ||
    request.nextUrl.pathname.startsWith("/manifest");

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
