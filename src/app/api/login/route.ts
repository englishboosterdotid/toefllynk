import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { cookies } from "next/headers";

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

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return Response.json({ success: true, message: "Login berhasil" });
  } catch (error: any) {
    
    return Response.json({ success: false, message: error.message });
  }
}