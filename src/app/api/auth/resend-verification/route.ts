import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, message: "Email diperlukan" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ success: true, message: "Link verifikasi telah dikirim" });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: "Email sudah terverifikasi" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationSentAt: new Date(),
      },
    });

    // Send verification email
    try {
      await sendEmail({
        to: email,
        subject: "Verifikasi Email - TOEFL Lynk",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Verifikasi Email Anda</h2>
            <p>Terima kasih telah mendaftar di TOEFL Lynk. Klik tombol di bawah untuk memverifikasi email Anda:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Verifikasi Email</a>
            </div>
            <p style="color: #64748b; font-size: 14px;"> atau salin link ini ke browser Anda:</p>
            <p style="color: #2563eb; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">Link ini akan kedaluwarsa dalam 24 jam.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">Jika Anda tidak merasa mendaftar di TOEFL Lynk, abaikan email ini.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue anyway - token is generated
    }

    return NextResponse.json({ success: true, message: "Link verifikasi telah dikirim" });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}