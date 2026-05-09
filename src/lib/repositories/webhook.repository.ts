import crypto from "crypto";
import { Prisma } from "@/generated/prisma/client";
import { BaseRepository } from "./base.repository";
import prisma from "@/lib/prisma";

const SELECT_WEBHOOK_BASIC = {
  id: true,
  userId: true,
  url: true,
  events: true,
  isActive: true,
  lastTriggered: true,
  failureCount: true,
  createdAt: true,
} as const;

export type WebhookBasic = Prisma.WebhookEndpointGetPayload<{ select: typeof SELECT_WEBHOOK_BASIC }>;

const SELECT_DELIVERY_BASIC = {
  id: true,
  webhookId: true,
  event: true,
  success: true,
  statusCode: true,
  deliveredAt: true,
} as const;

export type WebhookDeliveryBasic = Prisma.WebhookDeliveryGetPayload<{ select: typeof SELECT_DELIVERY_BASIC }>;

export class WebhookRepository extends BaseRepository {
  async findById(id: string): Promise<WebhookBasic | null> {
    return prisma.webhookEndpoint.findUnique({
      where: { id },
      select: SELECT_WEBHOOK_BASIC,
    });
  }

  async findByUserId(userId: string): Promise<WebhookBasic[]> {
    return prisma.webhookEndpoint.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: SELECT_WEBHOOK_BASIC,
    });
  }

  async findByIdWithDeliveries(id: string, limit = 10) {
    return prisma.webhookEndpoint.findUnique({
      where: { id },
      include: {
        deliveries: {
          orderBy: { deliveredAt: "desc" },
          take: limit,
        },
      },
    });
  }

  async create(data: {
    userId: string;
    url: string;
    events: string[];
    secret?: string;
  }): Promise<WebhookBasic> {
    const secret = data.secret || crypto.randomBytes(32).toString("hex");

    return prisma.webhookEndpoint.create({
      data: {
        userId: data.userId,
        url: data.url,
        events: data.events as any,
        secret,
      },
      select: SELECT_WEBHOOK_BASIC,
    });
  }

  async update(
    id: string,
    data: Partial<{
      url: string;
      events: string[];
      secret: string;
      isActive: boolean;
    }>
  ): Promise<WebhookBasic | null> {
    return prisma.webhookEndpoint.update({
      where: { id },
      data: {
        ...data,
        events: data.events as any,
      },
      select: SELECT_WEBHOOK_BASIC,
    });
  }

  async toggleActive(id: string, isActive: boolean): Promise<WebhookBasic | null> {
    return prisma.webhookEndpoint.update({
      where: { id },
      data: { isActive },
      select: SELECT_WEBHOOK_BASIC,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.webhookEndpoint.delete({ where: { id } });
  }

  async recordDelivery(data: {
    webhookId: string;
    event: string;
    payload: any;
    response?: any;
    statusCode?: number;
    success: boolean;
    error?: string;
  }): Promise<void> {
    await this.transaction(async (tx) => {
      // Create delivery record
      await tx.webhookDelivery.create({
        data: {
          webhookId: data.webhookId,
          event: data.event,
          payload: data.payload as any,
          response: data.response as any,
          statusCode: data.statusCode,
          success: data.success,
          error: data.error,
        },
      });

      // Update webhook last triggered and failure count
      await tx.webhookEndpoint.update({
        where: { id: data.webhookId },
        data: {
          lastTriggered: new Date(),
          failureCount: data.success ? 0 : { increment: 1 },
        },
      });
    });
  }

  async findActiveWebhooksForEvent(userId: string, event: string) {
    const allWebhooks = await prisma.webhookEndpoint.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: SELECT_WEBHOOK_BASIC,
    });

    // Filter webhooks that have the event
    return allWebhooks.filter(w => {
      const events = w.events as string[];
      return events.includes(event);
    });
  }

  async resetFailureCount(id: string): Promise<void> {
    await prisma.webhookEndpoint.update({
      where: { id },
      data: { failureCount: 0 },
    });
  }

  async findAllDeliveries(webhookId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where: { webhookId },
        orderBy: { deliveredAt: "desc" },
        skip,
        take: limit,
        select: SELECT_DELIVERY_BASIC,
      }),
      prisma.webhookDelivery.count({ where: { webhookId } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Generate signature for webhook payload
  generateSignature(payload: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
  }

  // Verify webhook signature
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

export const webhookRepository = new WebhookRepository();