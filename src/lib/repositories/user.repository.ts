import { Prisma } from "@/generated/prisma/client";
import { BaseRepository } from "./base.repository";
import prisma from "@/lib/prisma";

const SELECT_PUBLIC_FIELDS = {
  id: true,
  email: true,
  username: true,
  name: true,
  role: true,
  avatar: true,
  bio: true,
  whatsapp: true,
  headline: true,
  ctaText: true,
  sellerTier: true,
  subscriptionEnd: true,
  customFeeRate: true,
  customDomain: true,
  domainVerified: true,
  createdAt: true,
} as const;

const SELECT_WITH_STUDENT = {
  ...SELECT_PUBLIC_FIELDS,
  studentProfile: {
    select: { id: true },
  },
} as const;

export type UserPublic = Prisma.UserGetPayload<{ select: typeof SELECT_PUBLIC_FIELDS }>;
export type UserWithStudent = Prisma.UserGetPayload<{ select: typeof SELECT_WITH_STUDENT }>;

export class UserRepository extends BaseRepository {
  async findById(id: string): Promise<UserPublic | null> {
    return prisma.user.findUnique({
      where: { id },
      select: SELECT_PUBLIC_FIELDS,
    });
  }

  async findByIdWithStudent(id: string): Promise<UserWithStudent | null> {
    return prisma.user.findUnique({
      where: { id },
      select: SELECT_WITH_STUDENT,
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: { select: { id: true } },
      },
    });
  }

  async findByUsername(username: string): Promise<UserPublic | null> {
    return prisma.user.findUnique({
      where: { username },
      select: SELECT_PUBLIC_FIELDS,
    });
  }

  async findByUsernameWithProducts(username: string) {
    return prisma.user.findUnique({
      where: { username },
      include: {
        products: {
          where: { isArchived: false },
          orderBy: { createdAt: "desc" },
          include: {
            affiliateEnrollments: {
              select: { referralCode: true },
            },
          },
        },
      },
    });
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    username: string;
  }): Promise<UserPublic> {
    return prisma.user.create({
      data,
      select: SELECT_PUBLIC_FIELDS,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      bio?: string;
      whatsapp?: string;
      avatar?: string;
      headline?: string;
      ctaText?: string;
      sellerTier?: string;
      subscriptionEnd?: Date | null;
      customFeeRate?: number | null;
      customDomain?: string | null;
      domainVerified?: boolean;
    }
  ): Promise<UserPublic | null> {
    return prisma.user.update({
      where: { id },
      data: data as any,
      select: SELECT_PUBLIC_FIELDS,
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  }

  async checkUsernameExists(username: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { username } });
    return count > 0;
  }

  async isReservedUsername(username: string): Promise<boolean> {
    const RESERVED_USERNAMES = [
      "admin", "user", "users", "student", "students", "api", "auth", "login",
      "logout", "register", "signup", "dashboard", "settings", "profile",
      "products", "orders", "withdrawal", "withdrawals", "affiliate",
      "subscription", "seller", "sellers", "microsite", "www", "app", "help",
      "support", "about", "contact", "pricing", "blog", "news", "oauth",
      "callback", "webhook", "webhooks", "midtrans", "xendit", "blog"
    ];
    return RESERVED_USERNAMES.includes(username.toLowerCase());
  }

  async findAll(options?: {
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    page?: number;
    limit?: number;
  }) {
    const { where, orderBy, page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: SELECT_PUBLIC_FIELDS,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateTierInfo(userId: string, tier: string, subscriptionEnd: Date | null) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        sellerTier: tier as Prisma.EnumSellerTierFieldUpdateOperationsInput["set"],
        subscriptionEnd,
      },
      select: SELECT_PUBLIC_FIELDS,
    });
  }

  async updateBankInfo(userId: string, bankName: string, bankAccount: string, bankHolder: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        bankName,
        bankAccount,
        bankHolder,
      },
      select: SELECT_PUBLIC_FIELDS,
    });
  }
}

export const userRepository = new UserRepository();