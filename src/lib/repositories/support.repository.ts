import { Prisma } from "@/generated/prisma/client";
import { BaseRepository } from "./base.repository";
import prisma from "@/lib/prisma";
import { TicketPriority, TicketStatus } from "@/generated/prisma/enums";

const SELECT_TICKET_BASIC = {
  id: true,
  userId: true,
  subject: true,
  status: true,
  priority: true,
  category: true,
  message: true,
  responseMessage: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type TicketBasic = Prisma.SupportTicketGetPayload<{ select: typeof SELECT_TICKET_BASIC }>;

export class SupportRepository extends BaseRepository {
  async findById(id: string): Promise<TicketBasic | null> {
    return prisma.supportTicket.findUnique({
      where: { id },
      select: SELECT_TICKET_BASIC,
    });
  }

  async findByUserId(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: SELECT_TICKET_BASIC,
      }),
      prisma.supportTicket.count({ where: { userId } }),
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
    subject: string;
    message: string;
    category: string;
    priority?: TicketPriority;
  }): Promise<TicketBasic> {
    return prisma.supportTicket.create({
      data: {
        userId: data.userId,
        subject: data.subject,
        message: data.message,
        category: data.category,
        priority: data.priority || "NORMAL",
        status: "OPEN" as TicketStatus,
      },
      select: SELECT_TICKET_BASIC,
    });
  }

  async update(
    id: string,
    data: Partial<{
      status: TicketStatus;
      priority: TicketPriority;
      responseMessage: string;
    }>
  ): Promise<TicketBasic | null> {
    return prisma.supportTicket.update({
      where: { id },
      data,
      select: SELECT_TICKET_BASIC,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.supportTicket.delete({ where: { id } });
  }

  async countByUser(userId: string): Promise<number> {
    return prisma.supportTicket.count({ where: { userId } });
  }

  async countOpenByUser(userId: string): Promise<number> {
    return prisma.supportTicket.count({
      where: { userId, status: "OPEN" },
    });
  }

  async findAll(options?: {
    where?: Prisma.SupportTicketWhereInput;
    orderBy?: Prisma.SupportTicketOrderByWithRelationInput;
    page?: number;
    limit?: number;
  }) {
    const { where, orderBy, page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: orderBy || { createdAt: "desc" },
        skip,
        take: limit,
        select: SELECT_TICKET_BASIC,
      }),
      prisma.supportTicket.count({ where }),
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

export const supportRepository = new SupportRepository();