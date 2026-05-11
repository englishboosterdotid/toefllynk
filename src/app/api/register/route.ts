import { register } from "@/lib/services/authService";
import { z } from "zod";
import { isReservedUsername } from "@/lib/constants";
import { userRepository } from "@/lib/repositories";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

const RegisterSchema = z.object({
  name: z.string().min(2, "Nama harus minimal 2 karakter").max(100, "Nama harus maksimal 100 karakter"),
  email: z.string().email("Format email tidak valid"),
  username: z.string()
    .min(3, "Username harus minimal 3 karakter")
    .max(50, "Username harus maksimal 50 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore")
    .refine((val) => !isReservedUsername(val), {
      message: "Username ini tidak tersedia",
    }),
  password: z.string()
    .min(8, "Password harus minimal 8 karakter")
    .regex(/[a-z]/, "Password harus mengandung huruf kecil")
    .regex(/[A-Z]/, "Password harus mengandung huruf besar")
    .regex(/[0-9]/, "Password harus mengandung angka"),
});

async function sendVerificationEmail(email: string, token: string, name: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  try {
    await sendEmail({
      to: email,
      subject: "Verifikasi Email - TOEFL Lynk",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Verifikasi Email Anda</h2>
          <p>Halo ${name},</p>
          <p>Terima kasih telah mendaftar di TOEFL Lynk. Klik tombol di bawah untuk memverifikasi email Anda:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verifikasi Email</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">Atau salin link ini ke browser:</p>
          <p style="color: #2563eb; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px;">Link ini akan kedaluwarsa dalam 24 jam.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Jika Anda tidak merasa mendaftar di TOEFL Lynk, abaikan email ini.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = RegisterSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors).flat()[0] || "Data tidak valid";
      return Response.json({ success: false, message: firstError }, { status: 400 });
    }

    const { name, email, username, password } = validation.data;

    // Check email existence
    const existingEmail = await userRepository.checkEmailExists(email);
    if (existingEmail) {
      return Response.json({ success: false, message: "Email sudah dipakai" }, { status: 409 });
    }

    // Check username existence
    const existingUsername = await userRepository.checkUsernameExists(username);
    if (existingUsername) {
      return Response.json({ success: false, message: "Username sudah dipakai" }, { status: 409 });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Use authService.register() for actual registration
    const result = await register(name, email, password, username);

    if (!result.success) {
      return Response.json({ success: false, message: result.error }, { status: 400 });
    }

    // Update user with verification token
    await prisma.user.update({
      where: { email },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationSentAt: new Date(),
      },
    });

    // Send verification email (don't block registration on email failure)
    await sendVerificationEmail(email, verificationToken, name);

    return Response.json({
      success: true,
      message: "Registrasi berhasil. Silakan verifikasi email Anda.",
      needsVerification: true
    });
  } catch (error) {
    console.error("Register error:", error);
    return Response.json({ success: false, message: "Register gagal" }, { status: 500 });
  }
}