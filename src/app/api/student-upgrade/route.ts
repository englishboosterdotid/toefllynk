import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/getStudentSession";

export async function POST(req: Request) {
  const formData = await req.formData();

  const studentId = formData.get("studentId") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  // Auth check: require student session
  const student = await getStudentSession();
  if (!student) {
    return NextResponse.redirect(new URL("/student/login", req.url));
  }

  // Verify the student is upgrading their own account
  if (student.id !== studentId) {
    return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }

  const studentAccount = await prisma.studentAccount.findUnique({
    where: { id: studentId },
  });

  if (!studentAccount) {
    return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }

  // ALREADY UPGRADED
  if (studentAccount.userId) {
    return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }

  // CHECK USERNAME TAKEN
  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUsername) {
    return NextResponse.redirect(new URL("/student/dashboard?error=username", req.url));
  }

  // CHECK EMAIL TAKEN
  const existingEmail = await prisma.user.findUnique({
    where: { email: studentAccount.buyerEmail },
  });

  if (existingEmail) {
    return NextResponse.redirect(new URL("/student/dashboard?error=email", req.url));
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      username,
      email: studentAccount.buyerEmail,
      password: hashed,
      whatsapp: studentAccount.buyerWhatsapp || null,
      headline: `Official TOEFL Partner of ${studentAccount.buyerName}`,
    },
  });

  await prisma.studentAccount.update({
    where: { id: studentAccount.id },
    data: {
      userId: user.id,
    },
  });

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET!
  );

  const response = NextResponse.redirect(new URL("/user", req.url));

  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}