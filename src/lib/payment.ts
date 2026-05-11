/**
 * Midtrans Payment Gateway Integration
 *
 * Uses normalized schema pattern: SellerProfile, ProductSettings
 */

import midtransClient from "midtrans-client";
import prisma from "./prisma";
import { generateAccessToken } from "./generateAccessToken";
import { OrderStatus, ProductType } from "@/generated/prisma/enums";
import { sendOrderConfirmation } from "./email";
import { TierServiceClass } from "./services/TierService";
import { ProductService } from "./services/ProductService";
import { SellerService } from "./services/SellerService";

/**
 * Format date for Midtrans expiry
 * Format: yyyy-MM-dd hh:mm:ss Z (e.g., "2026-05-04 08:11:25 +0700")
 */
function formatMidtransTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const timezone = "+0700"; // Jakarta timezone
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${timezone}`;
}

// Initialize Midtrans Snap API
const getSnapApi = () => {
  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY is not configured");
  }

  return new midtransClient.Snap({
    isProduction,
    serverKey,
    clientKey: clientKey || serverKey,
  });
};

// Initialize Core API for refund/status checks
const getCoreApi = () => {
  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY is not configured");
  }

  return new midtransClient.CoreApi({
    isProduction,
    serverKey,
    clientKey: clientKey || serverKey,
  });
};

export interface CreateSnapTokenParams {
  orderId: string;
  amount: number;
  buyerName: string;
  buyerEmail: string;
  buyerWhatsapp?: string;
  productName: string;
}

export interface SnapTokenResponse {
  token: string;
  redirectUrl: string;
}

/**
 * Create Midtrans Snap Token
 */
export async function createSnapToken(
  params: CreateSnapTokenParams
): Promise<SnapTokenResponse> {
  const { orderId, amount, buyerName, buyerEmail, buyerWhatsapp, productName } = params;

  const snap = getSnapApi();

  // Prepare transaction details
  const transactionDetails = {
    order_id: orderId,
    gross_amount: amount,
  };

  // Prepare customer details
  const customerDetails = {
    first_name: buyerName,
    email: buyerEmail,
    phone: buyerWhatsapp || "",
  };

  // Prepare item details
  const itemDetails = [
    {
      id: orderId,
      price: amount,
      quantity: 1,
      name: productName.substring(0, 50), // Midtrans limit 50 chars
    },
  ];

  // Build snap parameters
  const snapParams = {
    transaction_details: transactionDetails,
    customer_details: customerDetails,
    item_details: itemDetails,
    credit_card: {
      secure: true,
      save_card: false, // Don't save card by default
    },
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL}/order/success?orderId=${orderId}`,
      error: `${process.env.NEXT_PUBLIC_APP_URL}/order/error?orderId=${orderId}`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/order/pending?orderId=${orderId}`,
    },
    expiry: {
      start_time: formatMidtransTime(new Date()),
      duration: 24, // hours
      unit: "hour",
    },
  };

  try {
    const response = await snap.createTransaction(snapParams);

    return {
      token: response.token,
      redirectUrl: response.redirect_url,
    };
  } catch (error) {
    console.error("[Midtrans] Failed to create snap token:", error);
    throw new Error("Failed to create payment token");
  }
}

/**
 * Handle Midtrans webhook notification
 * Called by Midtrans when payment status changes
 */
export async function handleMidtransNotification(
  payload: Record<string, unknown>
): Promise<void> {
  const orderId = payload.order_id as string;
  const transactionStatus = payload.transaction_status as string;
  const statusCode = payload.status_code as string;

  console.log(`[Midtrans Webhook] Order ${orderId}, Status: ${transactionStatus}, Code: ${statusCode}`);

  if (statusCode !== "200" && statusCode !== "201") {
    console.log(`[Midtrans Webhook] Non-success status code, skipping`);
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      product: {
        include: { settings: true },
      },
    },
  });

  if (!order) {
    console.log(`[Midtrans Webhook] Order ${orderId} not found`);
    return;
  }

  // Handle based on transaction status
  switch (transactionStatus) {
    case "settlement":
      // Payment successful
      await fulfillOrder(order);
      break;

    case "pending":
      // Payment pending (e.g., bank transfer initiated)
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PENDING },
      });
      break;

    case "deny":
      // Payment denied
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      break;

    case "cancel":
      // Payment cancelled
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      break;

    case "expire":
      // Payment expired
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      break;

    case "refund":
      // Payment refunded
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REFUNDED },
      });
      break;

    default:
      console.log(`[Midtrans Webhook] Unknown status: ${transactionStatus}`);
  }
}

/**
 * Fulfill order after successful payment
 * Uses normalized services
 */
async function fulfillOrder(order: {
  id: string;
  status: OrderStatus;
  referralCode: string | null;
  productId: string;
  buyerName: string;
  buyerEmail: string;
  buyerWhatsapp: string | null;
  studentId: string | null;
  product: {
    id: string;
    userId: string;
    productType: ProductType;
    title: string;
    price: number;
    settings: {
      promoPrice: number | null;
      examCredits: number;
    } | null;
  };
}) {
  // Skip if already completed
  if (order.product.productType === ProductType.TOEFL_SIMULATION) {
    const existingStudent = await prisma.studentAccount.findUnique({
      where: { buyerEmail: order.buyerEmail },
    });

    if (existingStudent && order.status === OrderStatus.COMPLETED) {
      return;
    }
  }

  // Update order status
  await prisma.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.COMPLETED },
  });

  // Get seller tier for platform fee calculation from SellerProfile
  const tierInfo = await SellerService.getTierInfo(order.product.userId);
  const price = order.product.settings?.promoPrice ?? order.product.price;
  const fee = Math.floor(price * (tierInfo.effectiveFeeRate / 100));

  await prisma.adminPlatformFee.create({
    data: {
      orderId: order.id,
      feeAmount: fee,
    },
  });

  // Handle affiliate commission if applicable
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

      // Add commission to affiliate's balance
      await SellerService.addToBalance(enrollment.affiliateUserId, commission);

      console.log(`[Midtrans] Affiliate commission created: Rp ${commission} for user ${enrollment.affiliateUserId}`);
    }
  }

  // Fulfill TOEFL simulation
  if (order.product.productType === ProductType.TOEFL_SIMULATION) {
    // StudentAccount sudah dibuat di createOrder(), tinggal link jika belum
    let student = await prisma.studentAccount.findUnique({
      where: { buyerEmail: order.buyerEmail },
    });

    if (student) {
      // Link order to student only if not already linked
      if (!order.studentId) {
        await prisma.order.update({
          where: { id: order.id },
          data: { studentId: student.id },
        });
      }

      // Create or update exam credits
      const examCredits = order.product.settings?.examCredits || 1;
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
        await prisma.studentExamCredit.create({
          data: {
            studentId: student.id,
            totalCredit: examCredits,
            productId: order.product.id,
          },
        });
      }

      // Update student total purchased
      await prisma.studentAccount.update({
        where: { id: student.id },
        data: { totalPurchased: { increment: price } },
      });

      // Send confirmation email with access token
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      try {
        await sendOrderConfirmation(order.buyerEmail, {
          orderId: order.id,
          productName: order.product.title,
          amount: price,
          buyerName: order.buyerName,
          accessToken: student.accessToken,
          examCredits: examCredits,
          dashboardUrl: `${appUrl}/student/dashboard`,
          loginUrl: `${appUrl}/student/login`,
        });
      } catch (emailError) {
        console.error("[Midtrans] Failed to send confirmation email:", emailError);
      }
    }
  }

  // ============ INTEGRATION HOOKS ============

  // 1. Auto-create/update customer
  try {
    const { upsertCustomerFromOrder } = await import("@/lib/services/customerService");
    await upsertCustomerFromOrder(order.product.userId, {
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      buyerWhatsapp: order.buyerWhatsapp,
      productPrice: price,
    });
  } catch (customerError) {
    console.error("[Midtrans] Failed to create customer:", customerError);
  }

  // 2. Trigger webhook for order completed
  try {
    const { onOrderCompleted } = await import("@/lib/services/webhookService");
    await onOrderCompleted(order.id);
  } catch (webhookError) {
    console.error("[Midtrans] Failed to trigger webhook:", webhookError);
  }
}

/**
 * Get transaction status from Midtrans
 */
export async function getTransactionStatus(orderId: string) {
  try {
    const core = getCoreApi();
    // Use charge method with status request
    const response = await (core as any).transaction.status(orderId);
    return response;
  } catch (error) {
    console.error("[Midtrans] Failed to get transaction status:", error);
    return null;
  }
}

/**
 * Refund transaction
 */
export async function refundTransaction(
  orderId: string,
  amount?: number // optional partial refund
) {
  try {
    const core = getCoreApi() as any;

    if (amount) {
      await core.refund(orderId, {
        refund_amount: amount,
        reason: "Customer request",
      });
    } else {
      await core.refund(orderId, {
        reason: "Customer request",
      });
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.REFUNDED },
    });

    return true;
  } catch (error) {
    console.error("[Midtrans] Refund failed:", error);
    return false;
  }
}
