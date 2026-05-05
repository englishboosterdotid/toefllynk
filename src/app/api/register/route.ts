import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { setAuthCookie } from "@/lib/cookies";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required!");
}

const RegisterSchema = z.object({
  name: z.string().min(2, "Nama harus minimal 2 karakter").max(100, "Nama harus maksimal 100 karakter"),
  email: z.string().email("Format email tidak valid"),
  username: z.string().min(3, "Username harus minimal 3 karakter").max(50, "Username harus maksimal 50 karakter").regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  password: z.string()
    .min(8, "Password harus minimal 8 karakter")
    .regex(/[a-z]/, "Password harus mengandung huruf kecil")
    .regex(/[A-Z]/, "Password harus mengandung huruf besar")
    .regex(/[0-9]/, "Password harus mengandung angka"),
});

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

    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return Response.json({ success: false, message: "Email sudah dipakai" }, { status: 409 });
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return Response.json({ success: false, message: "Username sudah dipakai" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        password: hashedPassword,
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    await setAuthCookie(token);

    return Response.json({ success: true, message: "Registrasi berhasil" });
  } catch (error) {
    console.error("Register error:", error);
    return Response.json({ success: false, message: "Register gagal" }, { status: 500 });
  }
}