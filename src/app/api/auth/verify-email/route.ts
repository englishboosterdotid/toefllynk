import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { nanoid } from "@/lib/nanoid";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/register?error=missing-token", req.url));
    }

    // Find user by verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerified: false,
      },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/register?error=invalid-token", req.url));
    }

    // Check if token is expired (24 hours)
    const sentAt = user.emailVerificationSentAt;
    if (sentAt) {
      const expiryTime = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - sentAt.getTime() > expiryTime) {
        return NextResponse.redirect(new URL("/register?error=token-expired", req.url));
      }
    }

    // Verify email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationSentAt: null,
      },
    });

    // Redirect to login with success message
    return NextResponse.redirect(new URL("/login?verified=1", req.url));
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(new URL("/register?error=verification-failed", req.url));
  }
}