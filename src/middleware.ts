import { type NextRequest } from "next/server";
import { authMiddleware } from "@/lib/auth/middleware";

export async function middleware(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|sw.js|workbox|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
