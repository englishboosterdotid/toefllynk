import { NextResponse } from "next/server";
import { getCookieOptions } from "@/lib/cookies";

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL("/student/login", req.url));

  const cookieOptions = getCookieOptions();
  response.cookies.set("student_token", "", {
    ...cookieOptions,
    maxAge: 0,
  });

  return response;
}

export async function GET(req: Request) {
  const response = NextResponse.redirect(new URL("/student/login", req.url));

  const cookieOptions = getCookieOptions();
  response.cookies.set("student_token", "", {
    ...cookieOptions,
    maxAge: 0,
  });

  return response;
}