import { NextResponse } from "next/server";
import { handleMidtransNotification } from "@/lib/payment";
import { TierService } from "@/lib/services/TierService";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    const midtransServerKey = process.env.MIDTRANS_SERVER_KEY;
    if (!midtransServerKey) {
      console.error("[Midtrans Webhook] MIDTRANS_SERVER_KEY is not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const signatureKey = crypto
      .createHash("sha512")
      .update(rawBody + midtransServerKey)
      .digest("hex");

    const midtransSignature = req.headers.get("x-midtrans-signature");

    const isLocalDev = process.env.NODE_ENV === "development" && !midtransSignature;

    if (!isLocalDev) {
      if (!midtransSignature || signatureKey !== midtransSignature) {
        console.error("[Midtrans Webhook] Invalid or missing signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const orderId = payload.order_id as string;

    // Check if this is a tier upgrade order (T-xxx or TIER-xxx)
    if (orderId && (orderId.startsWith("TIER-") || orderId.startsWith("T-"))) {
      console.log("[Midtrans Webhook] Processing tier upgrade order:", orderId);
      await TierService.handleUpgradeNotification(payload);
    } else {
      // Regular product order
      await handleMidtransNotification(payload);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Midtrans Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}