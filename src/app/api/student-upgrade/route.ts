import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();

  const studentId = formData.get("studentId") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const student = await prisma.studentAccount.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }

  // ALREADY UPGRADED
  if (student.userId) {
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
    where: { email: student.buyerEmail },
  });

  if (existingEmail) {
    return NextResponse.redirect(new URL("/student/dashboard?error=email", req.url));
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email: student.buyerEmail,
      password: hashed,
      whatsapp: student.buyerWhatsapp || null,
      headline: `Official TOEFL Partner of ${student.buyerName}`,
    },
  });

  await prisma.studentAccount.update({
    where: { id: student.id },
    data: {
      userId: user.id,
    },
  });

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    process.env.JWT_SECRET!
  );

  const response = NextResponse.redirect(new URL("/user", req.url));

  response.cookies.set("token", token, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}