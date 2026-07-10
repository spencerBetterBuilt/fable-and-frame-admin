import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, sessionToken } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // The admin. subdomain and booking. subdomain point at the same
  // deployment, so "/" would otherwise render the public booking page even
  // when visited via admin. — send admin. straight to the dashboard instead.
  if (pathname === "/" && host.startsWith("admin.")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (pathname.startsWith("/admin")) {
    const cookie = request.cookies.get(SESSION_COOKIE)?.value;
    if (cookie !== sessionToken()) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin", "/admin/((?!login).*)"],
};
