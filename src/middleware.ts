import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const isLogin = path.startsWith("/login");
  const isApiAuth = path.startsWith("/api/auth");
  const isPublicCron = path.startsWith("/api/cron");

  if (isApiAuth || isPublicCron) return NextResponse.next();

  if (!isLoggedIn && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && isLogin) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  const role = req.auth?.user?.role;

  if (role === "worker" && path.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
