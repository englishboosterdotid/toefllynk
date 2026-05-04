import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL("/student/login", req.url));

  // Clear student token cookie
  response.cookies.set("student_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}

// Also support GET for convenience
export async function GET(req: Request) {
  const response = NextResponse.redirect(new URL("/student/login", req.url));

  response.cookies.set("student_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}