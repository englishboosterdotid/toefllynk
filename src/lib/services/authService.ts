import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { Role } from "@/generated/prisma/enums";
import { setAuthCookie, deleteAuthCookie } from "@/lib/cookies";

const JWT_SECRET = process.env.JWT_SECRET || "toefllynk-secret-key-change-in-production";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: Role;
  avatar: string | null;
  bio: string | null;
  whatsapp: string | null;
  headline: string | null;
  ctaText: string | null;
  hasStudentAccount: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string, email: string, username: string, role: string): string {
  return jwt.sign({ userId, email, username, role }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string; email: string; username: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; username: string; role: string };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        whatsapp: true,
        headline: true,
        ctaText: true,
        studentProfile: {
          select: { id: true },
        },
      },
    });

    if (!user) return null;

    return {
      ...user,
      hasStudentAccount: !!user.studentProfile,
    };
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: { select: { id: true } },
      },
    });

    if (!user) {
      return { success: false, error: "Email atau password salah" };
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return { success: false, error: "Email atau password salah" };
    }

    const token = generateToken(user.id, user.email, user.username, user.role);
    await setAuthCookie(token);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        whatsapp: user.whatsapp,
        headline: user.headline,
        ctaText: user.ctaText,
        hasStudentAccount: !!user.studentProfile,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Terjadi kesalahan saat login" };
  }
}

export async function register(
  name: string,
  email: string,
  password: string,
  username: string
): Promise<LoginResult> {
  try {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return { success: false, error: "Email sudah terdaftar" };
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return { success: false, error: "Username sudah digunakan" };
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        username,
      },
    });

    const token = generateToken(user.id, user.email, user.username, user.role);
    await setAuthCookie(token);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        whatsapp: user.whatsapp,
        headline: user.headline,
        ctaText: user.ctaText,
        hasStudentAccount: false,
      },
    };
  } catch (error) {
    console.error("Register error:", error);
    return { success: false, error: "Terjadi kesalahan saat registrasi" };
  }
}

export async function logout(): Promise<void> {
  await deleteAuthCookie();
}

export async function updateProfile(
  userId: string,
  data: Partial<{
    name: string;
    bio: string;
    whatsapp: string;
    avatar: string;
    headline: string;
    ctaText: string;
  }>
): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        whatsapp: true,
        headline: true,
        ctaText: true,
        studentProfile: {
          select: { id: true },
        },
      },
    });

    return {
      ...user,
      hasStudentAccount: !!user.studentProfile,
    };
  } catch (error) {
    console.error("Update profile error:", error);
    return null;
  }
}