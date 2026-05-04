import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const buyerEmail = formData.get("buyerEmail") as string;
    const accessToken = formData.get("accessToken") as string;

    if (!buyerEmail || !accessToken) {
      return NextResponse.redirect(
        new URL("/student/login?error=missing_fields", req.url)
      );
    }

    // Find student by email and access token
    const student = await prisma.studentAccount.findFirst({
      where: {
        buyerEmail: buyerEmail.toLowerCase().trim(),
        accessToken: accessToken.trim(),
      },
    });

    if (!student) {
      return NextResponse.redirect(
        new URL("/student/login?error=invalid_credentials", req.url)
      );
    }

    // Set student token cookie
    const response = NextResponse.redirect(
      new URL("/student/dashboard", req.url)
    );

    response.cookies.set("student_token", student.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[API /student-login] Error:", error);
    return NextResponse.redirect(
      new URL("/student/login?error=server_error", req.url)
    );
  }
}

// Handle GET for displaying errors
export async function GET(req: Request) {
  const url = new URL(req.url);
  const error = url.searchParams.get("error");

  if (error === "missing_fields") {
    return NextResponse.json({ error: "Email and access token are required" }, { status: 400 });
  }
  if (error === "invalid_credentials") {
    return NextResponse.json({ error: "Invalid email or access token" }, { status: 401 });
  }
  if (error === "server_error") {
    return NextResponse.json({ error: "Server error occurred" }, { status: 500 });
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}