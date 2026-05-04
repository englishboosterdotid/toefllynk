import { NextResponse } from "next/server";
import { handleMidtransNotification } from "@/lib/payment";
import crypto from "crypto";

/**
 * Midtrans Webhook Handler
 * This endpoint is called by Midtrans when payment status changes
 *
 * IMPORTANT: Configure this URL in Midtrans Dashboard:
 * Dashboard > Settings > Payment Options > Webhook URL
 */
export async function POST(req: Request) {
  try {
    // Get raw body for signature verification
    const rawBody = await req.text();

    // Verify signature from Midtrans
    const signatureKey = crypto
      .createHash("sha512")
      .update(
        rawBody +
          (process.env.MIDTRANS_SERVER_KEY || "")
      )
      .digest("hex");

    const midtransSignature = req.headers.get("x-midtrans-signature");

    // In production, verify signature
    if (process.env.NODE_ENV === "production" && midtransSignature) {
      if (signatureKey !== midtransSignature) {
        console.error("[Midtrans Webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Parse notification
    const payload = JSON.parse(rawBody);

    // Handle notification
    await handleMidtransNotification(payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Midtrans Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: "ok" });
}