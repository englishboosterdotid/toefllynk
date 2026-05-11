import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

function generateCode(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const productId = formData.get("productId") as string;
    const ownerUserId = formData.get("ownerUserId") as string;
    const commissionPercent = parseInt(formData.get("commissionPercent") as string) || 10;

    const user = await requireUser();

    const existing = await prisma.affiliateEnrollment.findFirst({
      where: {
        affiliateUserId: user.id,
        productId,
      },
    });

    if (!existing) {
      await prisma.affiliateEnrollment.create({
        data: {
          affiliateUserId: user.id,
          ownerUserId,
          productId,
          referralCode: generateCode(),
          commissionPercent,
        },
      });
    }

    return Response.redirect(new URL("/user/my-affiliate-links", req.url));
  } catch (error: any) {
    console.error("Affiliate join error:", error);
    return Response.redirect(new URL("/login", req.url));
  }
}