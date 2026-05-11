import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function RefRedirectPage({
  params,
}: {
  params: Promise<{ code: string; productId: string }>;
}) {
  const { code, productId } = await params;

  // Find the enrollment by referral code
  const enrollment = await prisma.affiliateEnrollment.findUnique({
    where: { referralCode: code },
    select: { affiliateUserId: true },
  });

  if (!enrollment) {
    redirect(`/product/${productId}`);
  }

  // Get the affiliate user's username
  const affiliateUser = await prisma.user.findUnique({
    where: { id: enrollment.affiliateUserId },
    select: { username: true },
  });

  if (!affiliateUser) {
    redirect(`/product/${productId}`);
  }

  // Redirect to microsite URL with ref for tracking
  redirect(`/${affiliateUser.username}/${productId}?ref=${code}`);
}
