import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { cookies as nextCookies } from "next/headers";
import { Role } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { setAuthCookie, deleteAuthCookie } from "@/lib/cookies";
import { RESERVED_USERNAMES } from "@/lib/constants";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required!");
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: Role;
  avatar: string | null;
  createdAt: Date;
  hasStudentAccount: boolean;
  // Profile fields
  bio?: string | null;
  whatsapp?: string | null;
  headline?: string | null;
  ctaText?: string | null;
  sellerTier?: string;
  subscriptionEnd?: Date | null;
  customFeeRate?: number | null;
  customDomain?: string | null;
  domainVerified?: boolean;
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
      include: {
        profile: {
          select: {
            bio: true,
            whatsapp: true,
            headline: true,
            ctaText: true,
            sellerTier: true,
            subscriptionEnd: true,
            customFeeRate: true,
            customDomain: true,
            domainVerified: true,
          },
        },
        studentProfile: { select: { id: true } },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
      hasStudentAccount: !!user.studentProfile,
      bio: user.profile?.bio,
      whatsapp: user.profile?.whatsapp,
      headline: user.profile?.headline,
      ctaText: user.profile?.ctaText,
      sellerTier: user.profile?.sellerTier,
      subscriptionEnd: user.profile?.subscriptionEnd,
      customFeeRate: user.profile?.customFeeRate,
      customDomain: user.profile?.customDomain,
      domainVerified: user.profile?.domainVerified,
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
        profile: {
          select: {
            sellerTier: true,
            subscriptionEnd: true,
            customFeeRate: true,
            customDomain: true,
            domainVerified: true,
          },
        },
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
        createdAt: user.createdAt,
        hasStudentAccount: !!user.studentProfile,
        sellerTier: user.profile?.sellerTier,
        subscriptionEnd: user.profile?.subscriptionEnd,
        customFeeRate: user.profile?.customFeeRate,
        customDomain: user.profile?.customDomain,
        domainVerified: user.profile?.domainVerified,
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
    // Check reserved usernames
    if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
      return { success: false, error: "Username ini tidak tersedia" };
    }

    const existingEmail = await prisma.user.count({ where: { email } });
    if (existingEmail > 0) {
      return { success: false, error: "Email sudah terdaftar" };
    }

    const existingUsername = await prisma.user.count({ where: { username } });
    if (existingUsername > 0) {
      return { success: false, error: "Username sudah digunakan" };
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        username,
        profile: {
          create: {
            sellerTier: "FREE",
          },
        },
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
        createdAt: user.createdAt,
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
    avatar: string;
    bio: string;
    headline: string;
    ctaText: string;
    whatsapp: string;
  }>
): Promise<AuthUser | null> {
  try {
    // Update user basic info
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        avatar: data.avatar,
      },
    });

    // Update seller profile if provided
    const profileData: Record<string, unknown> = {};
    if (data.bio !== undefined) profileData.bio = data.bio;
    if (data.headline !== undefined) profileData.headline = data.headline;
    if (data.ctaText !== undefined) profileData.ctaText = data.ctaText;
    if (data.whatsapp !== undefined) profileData.whatsapp = data.whatsapp;

    if (Object.keys(profileData).length > 0) {
      await prisma.sellerProfile.upsert({
        where: { userId },
        create: { userId, ...profileData },
        update: profileData,
      });
    }

    // Get updated user with profile
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          select: {
            bio: true,
            whatsapp: true,
            headline: true,
            ctaText: true,
            sellerTier: true,
            subscriptionEnd: true,
            customFeeRate: true,
            customDomain: true,
            domainVerified: true,
          },
        },
        studentProfile: { select: { id: true } },
      },
    });

    if (!updatedUser) return null;

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      name: updatedUser.name,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      createdAt: updatedUser.createdAt,
      hasStudentAccount: !!updatedUser.studentProfile,
      bio: updatedUser.profile?.bio,
      whatsapp: updatedUser.profile?.whatsapp,
      headline: updatedUser.profile?.headline,
      ctaText: updatedUser.profile?.ctaText,
      sellerTier: updatedUser.profile?.sellerTier,
      subscriptionEnd: updatedUser.profile?.subscriptionEnd,
      customFeeRate: updatedUser.profile?.customFeeRate,
      customDomain: updatedUser.profile?.customDomain,
      domainVerified: updatedUser.profile?.domainVerified,
    };
  } catch (error) {
    console.error("Update profile error:", error);
    return null;
  }
}
