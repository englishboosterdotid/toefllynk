/**
 * Seller Tier Upgrade API
 * Handles tier upgrade purchases via Midtrans
 */

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import prisma from "@/lib/prisma";
import { SellerTier } from "@/generated/prisma/enums";
import { TierService, TierServiceClass, SUBSCRIPTION_PLANS } from "@/lib/services/TierService";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const IS_PRODUCTION = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

interface UpgradeRequest {
  targetTier: SellerTier;
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body: UpgradeRequest = await req.json();
    const { targetTier } = body;

    // Validate target tier
    if (!["PRO", "BUSINESS"].includes(targetTier)) {
      return NextResponse.json(
        { success: false, message: "Tier tidak valid" },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        sellerTier: true,
        email: true,
        name: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if trying to downgrade
    if (TierServiceClass.getRank(targetTier) <= TierServiceClass.getRank(currentUser.sellerTier)) {
      return NextResponse.json(
        { success: false, message: "Tidak bisa downgrade tier" },
        { status: 400 }
      );
    }

    // Get plan details
    const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === targetTier);
    if (!plan) {
      return NextResponse.json(
        { success: false, message: "Plan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check for existing PENDING subscription
    const existingPending = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: "PENDING",
      },
    });

    if (existingPending) {
      // Return existing pending subscription
      return NextResponse.json({
        success: true,
        token: null,
        redirectUrl: null,
        orderId: existingPending.id,
        message: "Pending subscription exists",
        existing: true,
      });
    }

    // Generate order ID - Midtrans max 50 chars
    const timestamp = Date.now().toString(36);
    const orderId = `T-${user.id.slice(-10)}-${targetTier}-${timestamp}`;

    try {
      // Create Snap token via Midtrans
      console.log("[Upgrade] Creating Midtrans token for order:", orderId);
      const snapResponse = await createMidtransSnapToken({
        orderId,
        amount: plan.price,
        buyerName: currentUser.name || currentUser.email.split("@")[0],
        buyerEmail: currentUser.email,
        productName: `TL-${plan.tier}`,
      });
      console.log("[Upgrade] Midtrans token created, saving subscription:", orderId);

      // Store pending subscription request ONLY after Midtrans success
      await prisma.subscription.create({
        data: {
          id: orderId,
          userId: user.id,
          tier: targetTier,
          amount: plan.price,
          status: "PENDING",
        },
      });
      console.log("[Upgrade] Subscription saved:", orderId);

      return NextResponse.json({
        success: true,
        token: snapResponse.token,
        redirectUrl: snapResponse.redirectUrl,
        orderId,
      });
    } catch (midtransError: any) {
      // Clean up on failure - no record created
      console.error("[Upgrade] Midtrans error:", midtransError.message);
      return NextResponse.json(
        { success: false, message: "Payment gateway error: " + midtransError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Seller upgrade error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

interface SnapTokenResponse {
  token: string;
  redirectUrl: string;
}

async function createMidtransSnapToken(params: {
  orderId: string;
  amount: number;
  buyerName: string;
  buyerEmail: string;
  productName: string;
}): Promise<SnapTokenResponse> {
  if (!MIDTRANS_SERVER_KEY) {
    throw new Error("Midtrans server key not configured");
  }

  // Dynamic import midtrans client
  const midtransClient = await import("midtrans-client");

  const snap = new midtransClient.Snap({
    isProduction: IS_PRODUCTION,
    serverKey: MIDTRANS_SERVER_KEY,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || MIDTRANS_SERVER_KEY,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Format expiry to 24 hours from now
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);

  const pad = (n: number) => n.toString().padStart(2, "0");
  const expiryStr = `${expiry.getFullYear()}-${pad(expiry.getMonth() + 1)}-${pad(expiry.getDate())} ${pad(expiry.getHours())}:${pad(expiry.getMinutes())}:${pad(expiry.getSeconds())} +0700`;

  const snapParams = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.floor(params.amount), // Ensure integer
    },
    customer_details: {
      first_name: params.buyerName.slice(0, 50),
      email: params.buyerEmail,
    },
    item_details: [
      {
        id: params.orderId.slice(0, 50),
        price: Math.floor(params.amount), // Ensure integer
        quantity: 1,
        name: params.productName.slice(0, 50),
      },
    ],
    callbacks: {
      finish: `${appUrl}/user/subscription?upgrade=success&orderId=${params.orderId}`,
      error: `${appUrl}/user/subscription?upgrade=error&orderId=${params.orderId}`,
      pending: `${appUrl}/user/subscription?upgrade=pending&orderId=${params.orderId}`,
    },
    expiry: {
      start_time: new Date().toISOString().slice(0, 19).replace("T", " ") + " +0700",
      duration: 24,
      unit: "hour",
    },
  };

  const response = await snap.createTransaction(snapParams);

  return {
    token: response.token,
    redirectUrl: response.redirect_url,
  };
}
