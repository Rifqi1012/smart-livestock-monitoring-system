import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Next 16 renamed `middleware` → `proxy` (nodejs runtime). Same job: route guard.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // Not logged in → send to login (preserve intended destination)
  if (!user) {
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  // /settings (Kelola Threshold, Kelola User) is admin-only
  if (pathname.startsWith("/settings") && user.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

// Only guard the app pages; login, API, and static assets are excluded.
export const config = {
  matcher: ["/dashboard/:path*", "/monitoring/:path*", "/alerts/:path*", "/settings/:path*"],
};
