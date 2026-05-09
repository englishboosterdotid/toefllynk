import { webhookRepository, type WebhookBasic } from "@/lib/repositories";
import { TierServiceClass } from "@/lib/services/TierService";
import { SellerTier } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

export const WEBHOOK_EVENTS = {
  ORDER_COMPLETED: "order.completed",
  ORDER_REFUNDED: "order.refunded",
  ORDER_PENDING: "order.pending",
  WITHDRAWAL_COMPLETED: "withdrawal.completed",
  WITHDRAWAL_REJECTED: "withdrawal.rejected",
  SUBSCRIPTION_ACTIVATED: "subscription.activated",
  SUBSCRIPTION_EXPIRED: "subscription.expired",
} as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
}

export async function createWebhook(
  userId: string,
  data: {
    url: string;
    events: WebhookEvent[];
    secret?: string;
  }
): Promise<{ success: boolean; webhook?: WebhookBasic; error?: string }> {
  try {
    // Check tier - BUSINESS only
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sellerTier: true },
    });

    if (!user) {
      return { success: false, error: "User tidak ditemukan" };
    }

    const tierConfig = TierServiceClass.getConfig(user.sellerTier as SellerTier);

    if (!tierConfig.hasWebhook) {
      return { success: false, error: "Fitur Webhook hanya untuk BUSINESS tier" };
    }

    // Validate URL
    try {
      new URL(data.url);
    } catch {
      return { success: false, error: "URL tidak valid" };
    }

    const webhook = await webhookRepository.create({
      userId,
      url: data.url,
      events: data.events,
      secret: data.secret,
    });

    return { success: true, webhook };
  } catch (error) {
    console.error("Create webhook error:", error);
    return { success: false, error: "Terjadi kesalahan saat membuat webhook" };
  }
}

export async function getWebhooks(
  userId: string
): Promise<{ success: boolean; webhooks?: WebhookBasic[]; error?: string }> {
  try {
    const webhooks = await webhookRepository.findByUserId(userId);
    return { success: true, webhooks };
  } catch (error) {
    console.error("Get webhooks error:", error);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function updateWebhook(
  webhookId: string,
  userId: string,
  data: {
    url?: string;
    events?: WebhookEvent[];
    secret?: string;
    isActive?: boolean;
  }
): Promise<{ success: boolean; webhook?: WebhookBasic; error?: string }> {
  try {
    // Verify ownership
    const webhook = await webhookRepository.findById(webhookId);

    if (!webhook) {
      return { success: false, error: "Webhook tidak ditemukan" };
    }

    if (webhook.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    const updated = await webhookRepository.update(webhookId, data);

    return { success: true, webhook: updated || undefined };
  } catch (error) {
    console.error("Update webhook error:", error);
    return { success: false, error: "Terjadi kesalahan saat update webhook" };
  }
}

export async function deleteWebhook(
  webhookId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify ownership
    const webhook = await webhookRepository.findById(webhookId);

    if (!webhook) {
      return { success: false, error: "Webhook tidak ditemukan" };
    }

    if (webhook.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    await webhookRepository.delete(webhookId);

    return { success: true };
  } catch (error) {
    console.error("Delete webhook error:", error);
    return { success: false, error: "Terjadi kesalahan saat hapus webhook" };
  }
}

export async function triggerWebhook(
  webhookId: string,
  event: WebhookEvent,
  payload: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const webhook = await webhookRepository.findById(webhookId);

    if (!webhook || !webhook.isActive) {
      return { success: false, error: "Webhook tidak ditemukan atau nonaktif" };
    }

    // Get webhook with secret for sending
    const { default: prisma } = await import("@/lib/prisma");
    const webhookWithSecret = await prisma.webhookEndpoint.findUnique({
      where: { id: webhookId },
      select: { url: true, secret: true },
    });

    if (!webhookWithSecret || !webhook.isActive) {
      return { success: false, error: "Webhook tidak ditemukan atau nonaktif" };
    }

    // Prepare payload with event and timestamp
    const fullPayload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    const payloadString = JSON.stringify(fullPayload);

    // Generate signature
    const signature = webhookRepository.generateSignature(
      payloadString,
      webhookWithSecret.secret || ""
    );

    // Send webhook
    let response: any;
    let statusCode: number | undefined;
    let success = false;
    let errorMessage: string | undefined;

    try {
      response = await fetch(webhookWithSecret.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event,
          "X-Webhook-Timestamp": fullPayload.timestamp,
        },
        body: payloadString,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      statusCode = response.status;
      success = response.ok;
    } catch (fetchError: any) {
      errorMessage = fetchError.message;
    }

    // Record delivery
    await webhookRepository.recordDelivery({
      webhookId,
      event,
      payload: fullPayload,
      response: response ? await response.text().catch(() => null) : null,
      statusCode,
      success,
      error: errorMessage,
    });

    return { success };
  } catch (error) {
    console.error("Trigger webhook error:", error);
    return { success: false, error: "Terjadi kesalahan saat kirim webhook" };
  }
}

export async function triggerWebhooksForEvent(
  userId: string,
  event: WebhookEvent,
  payload: Record<string, any>
): Promise<void> {
  const webhooks = await webhookRepository.findActiveWebhooksForEvent(userId, event);

  // Trigger all webhooks in parallel
  await Promise.all(
    webhooks.map((webhook) =>
      triggerWebhook(webhook.id, event, payload).catch((err) => {
        console.error(`Failed to trigger webhook ${webhook.id}:`, err);
      })
    )
  );
}

// Utility function to trigger order completed webhooks
export async function onOrderCompleted(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      product: { select: { userId: true, title: true, promoPrice: true, price: true } },
    },
  });

  if (!order || order.status !== "COMPLETED") return;

  await triggerWebhooksForEvent(order.product.userId, WEBHOOK_EVENTS.ORDER_COMPLETED, {
    orderId: order.id,
    productTitle: order.product.title,
    buyerEmail: order.buyerEmail,
    buyerName: order.buyerName,
    status: order.status,
    totalAmount: order.product.promoPrice || order.product.price,
    createdAt: order.createdAt.toISOString(),
  });
}

// Utility function to trigger withdrawal completed webhooks
export async function onWithdrawalCompleted(
  withdrawalId: string,
  userId: string
): Promise<void> {
  await triggerWebhooksForEvent(userId, WEBHOOK_EVENTS.WITHDRAWAL_COMPLETED, {
    withdrawalId,
    status: "COMPLETED",
    completedAt: new Date().toISOString(),
  });
}

// Utility function to trigger subscription webhooks
export async function onSubscriptionActivated(
  userId: string,
  tier: string
): Promise<void> {
  await triggerWebhooksForEvent(userId, WEBHOOK_EVENTS.SUBSCRIPTION_ACTIVATED, {
    tier,
    status: "ACTIVE",
    activatedAt: new Date().toISOString(),
  });
}