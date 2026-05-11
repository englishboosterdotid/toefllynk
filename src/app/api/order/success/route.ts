import { generateAccessToken } from "@/lib/generateAccessToken";
import { OrderStatus, ProductType } from "@/generated/prisma/enums";
import { getSession } from "@/lib/session";
import { OrderService } from "@/lib/services/orderService";
import { ProductService } from "@/lib/services/ProductService";
import { SellerService } from "@/lib/services/SellerService";
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

  const order = await OrderService.getOrderById(orderId);

  if (!order) {
    return Response.redirect(new URL("/user/orders", req.url));
  }

  // Verify the order belongs to this user or user owns the product
  if (order.buyerEmail !== session.email && order.product.userId !== session.userId) {
    return Response.redirect(new URL("/user/orders", req.url));
  }

  // IDEMPOTENT GUARD
  if (order.status === OrderStatus.COMPLETED) {
    if (order.product && order.product.userId) {
      const tierInfo = await SellerService.getTierInfo(order.product.userId);

      if (tierInfo.sellerTier === "FREE" || (order.product.settings?.examCredits ?? 0) > 0) {
        const existingStudent = await prisma.studentAccount.findUnique({
          where: { buyerEmail: order.buyerEmail },
        });

        if (existingStudent) {
          return Response.redirect(
            new URL(`/user/student-access/${existingStudent.id}`, req.url)
          );
        }
      }
    }

    return Response.redirect(new URL("/user/orders", req.url));
  }

  await OrderService.completeOrder(orderId);

  // Get seller tier for platform fee calculation
  const tierInfo = await SellerService.getTierInfo(order.product.userId);

  // Calculate platform fee based on seller tier
  const price = order.product.settings?.promoPrice || order.product.price || 0;
  const fee = Math.floor(price * (tierInfo.effectiveFeeRate / 100));

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
  if (order.product.userId) {
    let student = await prisma.studentAccount.findUnique({
      where: { buyerEmail: order.buyerEmail },
    });

    if (!student) {
      student = await prisma.studentAccount.create({
        data: {
          buyerName: order.buyerName,
          buyerEmail: order.buyerEmail,
          buyerWhatsapp: order.buyerWhatsapp || null,
          accessToken: generateAccessToken(),
          ownerUserId: order.product.userId,
        },
      });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { studentId: student.id },
    });

    const examCredits = order.product.settings?.examCredits || 1;

    // Check if student already has credits for this product
    const existingCredit = await prisma.studentExamCredit.findFirst({
      where: {
        studentId: student.id,
        productId: order.product.id,
      },
    });

    if (existingCredit) {
      // Add credits to existing record
      await prisma.studentExamCredit.update({
        where: { id: existingCredit.id },
        data: {
          totalCredit: existingCredit.totalCredit + examCredits,
        },
      });
    } else {
      // Create new credit record
      await prisma.studentExamCredit.create({
        data: {
          studentId: student.id,
          totalCredit: examCredits,
          productId: order.product.id,
        },
      });
    }

    return Response.redirect(
      new URL(`/user/student-access/${student.id}`, req.url)
    );
  }

  // ===== BUNDLE FULFILLMENT =====
  return Response.redirect(new URL("/user/orders?success=bundle", req.url));
}