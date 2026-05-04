import { NextResponse } from "next/server";
import { deleteAuthCookie } from "@/lib/cookies";

export async function GET(req: Request) {
  await deleteAuthCookie();
  return NextResponse.redirect(new URL("/login", req.url));
}

export async function POST(req: Request) {
  await deleteAuthCookie();
  return NextResponse.json({ success: true });
}