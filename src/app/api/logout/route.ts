import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  cookieStore.delete("token"); // Also delete old cookie for compatibility

  return NextResponse.redirect(new URL("/login", req.url));
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  cookieStore.delete("token");

  return NextResponse.json({ success: true });
}