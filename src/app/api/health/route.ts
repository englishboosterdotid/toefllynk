import { NextResponse } from "next/server";
import { captureException } from "@/lib/sentry";

export async function GET() {
  try {
    // Simulate some work
    const data = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
    };

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    if (error instanceof Error) {
      captureException(error, { route: "/api/health" });
    }
    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 }
    );
  }
}