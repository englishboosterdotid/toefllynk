import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "toefllynk-secret-key-change-in-production";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const existingEmail = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingEmail) {
      return Response.json({ success: false, message: "Email sudah dipakai" });
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: body.username },
    });

    if (existingUsername) {
      return Response.json({ success: false, message: "Username sudah dipakai" });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        username: body.username,
        password: hashedPassword,
      },
    });

    // Create session token
    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return Response.json({ success: true, message: "Registrasi berhasil" });
  } catch (error) {
    console.error("Register error:", error);
    return Response.json({ success: false, message: "Register gagal" });
  }
}