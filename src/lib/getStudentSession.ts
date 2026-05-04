import { cookies } from "next/headers";
import prisma from "./prisma";

export async function getStudentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("student_token")?.value;

  if (!token) return null;

  return await prisma.studentAccount.findUnique({
    where: {
      accessToken: token,
    },
  });
}