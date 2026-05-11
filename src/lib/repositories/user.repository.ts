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
  createdAt: true,
} as const;

const SELECT_FULL_FIELDS = {
  ...SELECT_PUBLIC_FIELDS,
  profile: {
    select: {
      id: true,
      bio: true,
      headline: true,
      ctaText: true,
      whatsapp: true,
      sellerTier: true,
      subscriptionEnd: true,
      customFeeRate: true,
      customDomain: true,
      domainVerified: true,
      balance: true,
    },
  },
  bankAccount: {
    select: {
      id: true,
      bankName: true,
      bankAccount: true,
      bankHolder: true,
    },
  },
  studentProfile: {
    select: { id: true },
  },
} as const;

export type UserPublic = Prisma.UserGetPayload<{ select: typeof SELECT_PUBLIC_FIELDS }>;
export type UserFull = Prisma.UserGetPayload<{ select: typeof SELECT_FULL_FIELDS }>;

export class UserRepository extends BaseRepository {
  async findById(id: string): Promise<UserPublic | null> {
    return prisma.user.findUnique({
      where: { id },
      select: SELECT_PUBLIC_FIELDS,
    });
  }

  async findByIdWithProfile(id: string): Promise<UserFull | null> {
    return prisma.user.findUnique({
      where: { id },
      select: SELECT_FULL_FIELDS,
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
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
          where: { settings: { isArchived: false } },
          orderBy: { createdAt: "desc" },
          include: {
            settings: true,
            affiliateEnrollments: {
              select: { referralCode: true },
            },
          },
        },
        profile: true,
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
      avatar?: string;
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

  // ============ SELLER PROFILE METHODS ============

  async updateSellerProfile(userId: string, data: {
    bio?: string;
    headline?: string;
    ctaText?: string;
    whatsapp?: string;
  }) {
    return prisma.sellerProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async updateTierInfo(userId: string, tier: string, subscriptionEnd: Date | null) {
    return prisma.sellerProfile.upsert({
      where: { userId },
      create: {
        userId,
        sellerTier: tier as any,
        subscriptionEnd,
      },
      update: {
        sellerTier: tier as any,
        subscriptionEnd,
      },
    });
  }

  async updateBalance(userId: string, balance: number) {
    return prisma.sellerProfile.update({
      where: { userId },
      data: { balance },
    });
  }

  async incrementBalance(userId: string, amount: number) {
    return prisma.sellerProfile.update({
      where: { userId },
      data: { balance: { increment: amount } },
    });
  }

  // ============ BANK ACCOUNT METHODS ============

  async updateBankInfo(userId: string, bankName: string, bankAccount: string, bankHolder: string) {
    return prisma.bankAccount.upsert({
      where: { userId },
      create: { userId, bankName, bankAccount, bankHolder },
      update: { bankName, bankAccount, bankHolder },
    });
  }

  async getBankInfo(userId: string) {
    return prisma.bankAccount.findUnique({
      where: { userId },
    });
  }
}

export const userRepository = new UserRepository();
