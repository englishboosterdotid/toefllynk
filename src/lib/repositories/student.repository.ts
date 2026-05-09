import { Prisma } from "@/generated/prisma/client";
import { BaseRepository } from "./base.repository";
import prisma from "@/lib/prisma";

const SELECT_STUDENT_BASIC = {
  id: true,
  buyerName: true,
  buyerEmail: true,
  buyerWhatsapp: true,
  accessToken: true,
  ownerUserId: true,
  createdAt: true,
} as const;

const SELECT_STUDENT_WITH_CREDITS = {
  ...SELECT_STUDENT_BASIC,
  credits: {
    select: {
      id: true,
      productId: true,
      totalCredit: true,
      usedCredit: true,
      product: {
        select: {
          id: true,
          title: true,
          examCredits: true,
        },
      },
    },
  },
} as const;

export type StudentBasic = Prisma.StudentAccountGetPayload<{ select: typeof SELECT_STUDENT_BASIC }>;
export type StudentWithCredits = Prisma.StudentAccountGetPayload<{ select: typeof SELECT_STUDENT_WITH_CREDITS }>;

export class StudentRepository extends BaseRepository {
  async findById(id: string): Promise<StudentBasic | null> {
    return prisma.studentAccount.findUnique({
      where: { id },
      select: SELECT_STUDENT_BASIC,
    });
  }

  async findByIdWithCredits(id: string): Promise<StudentWithCredits | null> {
    return prisma.studentAccount.findUnique({
      where: { id },
      select: SELECT_STUDENT_WITH_CREDITS,
    });
  }

  async findByEmail(email: string): Promise<StudentBasic | null> {
    return prisma.studentAccount.findUnique({
      where: { buyerEmail: email },
      select: SELECT_STUDENT_BASIC,
    });
  }

  async findByEmailWithCredits(email: string): Promise<StudentWithCredits | null> {
    return prisma.studentAccount.findUnique({
      where: { buyerEmail: email },
      select: SELECT_STUDENT_WITH_CREDITS,
    });
  }

  async findByAccessToken(token: string): Promise<StudentBasic | null> {
    return prisma.studentAccount.findUnique({
      where: { accessToken: token },
      select: SELECT_STUDENT_BASIC,
    });
  }

  async findByAccessTokenWithCredits(token: string): Promise<StudentWithCredits | null> {
    return prisma.studentAccount.findUnique({
      where: { accessToken: token },
      select: SELECT_STUDENT_WITH_CREDITS,
    });
  }

  async findByOwnerUser(ownerUserId: string): Promise<StudentBasic[]> {
    return prisma.studentAccount.findMany({
      where: { ownerUserId },
      orderBy: { createdAt: "desc" },
      select: SELECT_STUDENT_BASIC,
    });
  }

  async create(data: {
    buyerName: string;
    buyerEmail: string;
    buyerWhatsapp?: string | null;
    accessToken: string;
    ownerUserId: string;
  }): Promise<StudentBasic> {
    return prisma.studentAccount.create({
      data,
      select: SELECT_STUDENT_BASIC,
    });
  }

  async update(
    id: string,
    data: Partial<{
      buyerName: string;
      buyerEmail: string;
      buyerWhatsapp: string | null;
    }>
  ): Promise<StudentBasic | null> {
    return prisma.studentAccount.update({
      where: { id },
      data,
      select: SELECT_STUDENT_BASIC,
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.studentAccount.count({ where: { buyerEmail: email } });
    return count > 0;
  }

  async existsByAccessToken(token: string): Promise<boolean> {
    const count = await prisma.studentAccount.count({ where: { accessToken: token } });
    return count > 0;
  }

  async countByOwnerUser(ownerUserId: string): Promise<number> {
    return prisma.studentAccount.count({ where: { ownerUserId } });
  }

  async findAll(options?: {
    where?: Prisma.StudentAccountWhereInput;
    orderBy?: Prisma.StudentAccountOrderByWithRelationInput;
    page?: number;
    limit?: number;
  }) {
    const { where, orderBy, page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.studentAccount.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: SELECT_STUDENT_BASIC,
      }),
      prisma.studentAccount.count({ where }),
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

export const studentRepository = new StudentRepository();