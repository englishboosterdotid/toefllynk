import { Prisma } from "@/generated/prisma/client";
import { BaseRepository } from "./base.repository";
import prisma from "@/lib/prisma";

const SELECT_CAMPAIGN_BASIC = {
  id: true,
  userId: true,
  name: true,
  subject: true,
  template: true,
  sentCount: true,
  deliveredCount: true,
  openCount: true,
  clickCount: true,
  status: true,
  scheduledAt: true,
  sentAt: true,
  createdAt: true,
} as const;

export type CampaignBasic = Prisma.EmailCampaignGetPayload<{ select: typeof SELECT_CAMPAIGN_BASIC }>;

export class EmailCampaignRepository extends BaseRepository {
  async findById(id: string): Promise<CampaignBasic | null> {
    return prisma.emailCampaign.findUnique({
      where: { id },
      select: SELECT_CAMPAIGN_BASIC,
    });
  }

  async findByUserId(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: SELECT_CAMPAIGN_BASIC,
      }),
      prisma.emailCampaign.count({ where: { userId } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: {
    userId: string;
    name: string;
    subject: string;
    template?: string | null;
    scheduledAt?: Date | null;
  }): Promise<CampaignBasic> {
    return prisma.emailCampaign.create({
      data,
      select: SELECT_CAMPAIGN_BASIC,
    });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      subject: string;
      template: string | null;
      status: string;
      scheduledAt: Date | null;
      sentAt: Date;
      sentCount: number;
      deliveredCount: number;
      openCount: number;
      clickCount: number;
    }>
  ): Promise<CampaignBasic | null> {
    return prisma.emailCampaign.update({
      where: { id },
      data,
      select: SELECT_CAMPAIGN_BASIC,
    });
  }

  async incrementStats(
    id: string,
    stats: { sent?: number; delivered?: number; opened?: number; clicked?: number }
  ): Promise<void> {
    const updateData: any = {};
    if (stats.sent) updateData.sentCount = { increment: stats.sent };
    if (stats.delivered) updateData.deliveredCount = { increment: stats.delivered };
    if (stats.opened) updateData.openCount = { increment: stats.opened };
    if (stats.clicked) updateData.clickCount = { increment: stats.clicked };

    await prisma.emailCampaign.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.emailCampaign.delete({ where: { id } });
  }

  async countByUser(userId: string): Promise<number> {
    return prisma.emailCampaign.count({ where: { userId } });
  }

  async findAll(options?: {
    where?: Prisma.EmailCampaignWhereInput;
    orderBy?: Prisma.EmailCampaignOrderByWithRelationInput;
    page?: number;
    limit?: number;
  }) {
    const { where, orderBy, page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: SELECT_CAMPAIGN_BASIC,
      }),
      prisma.emailCampaign.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const emailCampaignRepository = new EmailCampaignRepository();