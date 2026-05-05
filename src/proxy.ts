import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip for static files and API routes that have their own auth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get tokens from cookies
  const authToken = req.cookies.get("auth_token")?.value;
  const token = req.cookies.get("token")?.value;
  const studentToken = req.cookies.get("student_token")?.value;

  // Decode token helper
  const decodeToken = (t: string) => {
    try {
      return jwt.verify(t, JWT_SECRET) as { userId: string; email: string; username: string; role: string };
    } catch {
      return null;
    }
  };

  // Protect /user routes - require login
  if (pathname.startsWith("/user")) {
    const userToken = authToken || token;
    if (!userToken) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const decoded = decodeToken(userToken);
    if (!decoded) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("auth_token");
      response.cookies.delete("token");
      return response;
    }
  }

  // Protect /admin routes - require ADMIN role
  if (pathname.startsWith("/admin")) {
    const userToken = authToken || token;
    if (!userToken) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const decoded = decodeToken(userToken);
    if (!decoded) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("auth_token");
      response.cookies.delete("token");
      return response;
    }
    if (decoded.role !== "ADMIN") {
      // Redirect non-admin users away from admin pages
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect /student routes (require student_token)
  // student_token is plain access token, not JWT - just check if it exists
  if (pathname.startsWith("/student/") && pathname !== "/student/login") {
    if (!studentToken) {
      return NextResponse.redirect(new URL("/student/login", req.url));
    }
    // student_token is a plain string from database, no JWT verification needed
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/user/:path*",
    "/admin/:path*",
    "/student/:path*",
  ],
};