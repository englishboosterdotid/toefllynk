import prisma from "@/lib/prisma";
import { generateAccessToken } from "@/lib/generateAccessToken";
import { OrderStatus, ProductType } from "@/generated/prisma/enums";

export async function POST(req: Request) {
  const formData = await req.formData();
  const orderId = formData.get("orderId") as string;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      product: true,
      affiliateConversion: true,
      student: true,
    },
  });

  if (!order) {
    return Response.redirect(new URL("/user/orders", req.url));
  }

  // IDEMPOTENT GUARD
  if (order.status === OrderStatus.COMPLETED) {
    if (order.product.productType === ProductType.TOEFL_SIMULATION) {
      const existingStudent = await prisma.studentAccount.findUnique({
        where: {
          buyerEmail: order.buyerEmail,
        },
      });

      if (existingStudent) {
        return Response.redirect(
          new URL(`/user/student-access/${existingStudent.id}`, req.url)
        );
      }
    }

    return Response.redirect(new URL("/user/orders", req.url));
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.COMPLETED,
    },
  });

  // ADMIN PLATFORM FEE
  const fee = Math.floor((order.product.promoPrice || order.product.price) * 0.05);

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
      const commission = Math.floor(
        (order.product.promoPrice || order.product.price) *
          (enrollment.commissionPercent / 100)
      );

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
  if (order.product.productType === ProductType.TOEFL_SIMULATION) {
    let student = await prisma.studentAccount.findUnique({
      where: {
        buyerEmail: order.buyerEmail,
      },
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
      where: { id: order.id },
      data: {
        studentId: student.id,
      },
    });

    await prisma.studentExamCredit.create({
      data: {
        studentId: student.id,
        totalCredit: order.product.examCredits,
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