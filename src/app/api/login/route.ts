import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { setAuthCookie } from "@/lib/cookies";
import { loginSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required!");
}

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

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return Response.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return Response.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    await setAuthCookie(token);

    return Response.json({ success: true, message: "Login berhasil" });
  } catch (error: any) {
    console.error("Login error:", error);
    return Response.json(
      { success: false, message: "Terjadi kesalahan saat login" },
      { status: 500 }
    );
  }
}