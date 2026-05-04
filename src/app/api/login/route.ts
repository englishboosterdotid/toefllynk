import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { setAuthCookie } from "@/lib/cookies";

const JWT_SECRET = process.env.JWT_SECRET || "toefllynk-secret-key-change-in-production";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return Response.json({ success: false, message: "User tidak ditemukan" });
    }

    const valid = await bcrypt.compare(body.password, user.password);

    if (!valid) {
      return Response.json({ success: false, message: "Password salah" });
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
    return Response.json({ success: false, message: error.message });
  }
}