import { generateAccessToken } from "@/lib/generateAccessToken";
import { OrderStatus, ProductType } from "@/generated/prisma/enums";
import { getSession } from "@/lib/session";
import { orderRepository, studentRepository } from "@/lib/repositories";
import prisma from "@/lib/prisma";
import { TierServiceClass } from "@/lib/services/TierService";

export async function POST(req: Request) {
  const formData = await req.formData();
  const orderId = formData.get("orderId") as string;

  // Verify user is authenticated
  const session = await getSession();
  if (!session) {
    return Response.redirect(new URL("/login", req.url));
  }

  const order = await orderRepository.findById(orderId);

  if (!order) {
    return Response.redirect(new URL("/user/orders", req.url));
  }

  // Verify the order belongs to this user or user owns the product
  if (order.buyerEmail !== session.email && order.product.user.id !== session.userId) {
    return Response.redirect(new URL("/user/orders", req.url));
  }

  // IDEMPOTENT GUARD
  if (order.status === OrderStatus.COMPLETED) {
    if (order.product && order.product.user) {
      const ownerUser = await prisma.user.findUnique({
        where: { id: order.product.user.id },
        select: { sellerTier: true },
      });

      if (ownerUser?.sellerTier === "FREE" || order.product.examCredits > 0) {
        const existingStudent = await studentRepository.findByEmail(order.buyerEmail);

        if (existingStudent) {
          return Response.redirect(
            new URL(`/user/student-access/${existingStudent.id}`, req.url)
          );
        }
      }
    }

    return Response.redirect(new URL("/user/orders", req.url));
  }

  await orderRepository.updateStatus(orderId, OrderStatus.COMPLETED);

  // Get seller tier for platform fee calculation
  const seller = await prisma.user.findUnique({
    where: { id: order.product?.user?.id || "" },
    select: { sellerTier: true, customFeeRate: true },
  });

  // Calculate platform fee based on seller tier
  const price = order.product?.promoPrice || order.product?.price || 0;
  const feeRate = TierServiceClass.getEffectiveFee({
    sellerTier: seller?.sellerTier || "FREE",
    customFeeRate: seller?.customFeeRate ?? null,
  });
  const fee = Math.floor(price * (feeRate / 100));

  await prisma.adminPlatformFee.create({
    data: {
      orderId: order.id,
      feeAmount: fee,
    },
  });

  // AFFILIATE COMMISSION
  if (order.referralCode) {
    const enrollment = await prisma.affiliateEnrollment.findUnique({
      where: {
        referralCode: order.referralCode,
      },
    });

    if (enrollment) {
      const commission = Math.floor(price * (enrollment.commissionPercent / 100));

      await prisma.affiliateConversion.create({
        data: {
          referralCode: order.referralCode,
          orderId: order.id,
          affiliateUserId: enrollment.affiliateUserId,
          ownerUserId: enrollment.ownerUserId,
          commissionAmount: commission,
        },
      });
    }
  }

  // ===== TOEFL SIMULATION FULFILLMENT =====
  if (order.product?.user?.id) {
    let student = await studentRepository.findByEmail(order.buyerEmail);

    if (!student) {
      student = await studentRepository.create({
        buyerName: order.buyerName,
        buyerEmail: order.buyerEmail,
        buyerWhatsapp: order.buyerWhatsapp || null,
        accessToken: generateAccessToken(),
        ownerUserId: order.product.user.id,
      });
    }

    await orderRepository.linkStudent(order.id, student.id);

    await prisma.studentExamCredit.create({
      data: {
        studentId: student.id,
        totalCredit: order.product.examCredits || 1,
        productId: order.product.id,
      },
    });

    return Response.redirect(
      new URL(`/user/student-access/${student.id}`, req.url)
    );
  }

  // ===== BUNDLE FULFILLMENT =====
  return Response.redirect(new URL("/user/orders?success=bundle", req.url));
}