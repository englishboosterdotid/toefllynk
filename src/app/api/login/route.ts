import { login } from "@/lib/services/authService";
import { loginSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const rateLimitResult = await rateLimit(req);
    if (!rateLimitResult.success) {
      return Response.json(
        { success: false, message: rateLimitResult.message },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || "Input tidak valid";
      return Response.json(
        { success: false, message: errorMessage },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Check if user exists and email is verified
    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true },
    });

    if (user && !user.emailVerified) {
      return Response.json(
        {
          success: false,
          message: "Email belum diverifikasi. Silakan cek email untuk link verifikasi.",
          needsVerification: true
        },
        { status: 403 }
      );
    }

    const result = await login(email, password);

    if (!result.success) {
      return Response.json(
        { success: false, message: result.error },
        { status: 401 }
      );
    }

    return Response.json({
      success: true,
      message: "Login berhasil",
      user: {
        id: result.user!.id,
        role: result.user!.role,
        username: result.user!.username,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { success: false, message: "Terjadi kesalahan saat login" },
      { status: 500 }
    );
  }
}