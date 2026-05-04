import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check both auth_token and token for compatibility
  const authToken = req.cookies.get("auth_token")?.value;
  const token = req.cookies.get("token")?.value;
  const studentToken = req.cookies.get("student_token")?.value;

  // Protect /user routes
  if (pathname.startsWith("/user")) {
    if (!authToken && !token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    if (!authToken && !token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Protect /student routes (require student_token)
  if (pathname.startsWith("/student/") && pathname !== "/student/login") {
    if (!studentToken) {
      return NextResponse.redirect(new URL("/student/login", req.url));
    }
  }

  return NextResponse.next();
}