import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/authService";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ isLoggedIn: false, user: null });
    }

    return NextResponse.json({
      isLoggedIn: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    return NextResponse.json({ isLoggedIn: false, user: null });
  }
}