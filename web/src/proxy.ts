import { NextResponse, type NextRequest } from "next/server";

// EN is served at "/" (rewritten to /en internally), ID at "/id".
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/id" || pathname.startsWith("/id/")) return;
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|api|admin|dashboard|brand|img|favicon.ico|.*\\..*).*)"],
};
