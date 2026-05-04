import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const enrollmentId = formData.get("enrollmentId") as string;

  await prisma.affiliateEnrollment.delete({
    where: {
      id: enrollmentId,
    },
  });

  return NextResponse.redirect(new URL("/user/my-affiliate-links", req.url));
}