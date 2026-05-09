import crypto from "crypto";
import { Prisma } from "@/generated/prisma/client";
import { BaseRepository } from "./base.repository";
import prisma from "@/lib/prisma";

const SELECT_APIKEY_BASIC = {
  id: true,
  userId: true,
  keyPrefix: true,
  name: true,
  permissions: true,
  isActive: true,
  lastUsedAt: true,
  expiresAt: true,
  createdAt: true,
} as const;

export type ApiKeyBasic = Prisma.ApiKeyGetPayload<{ select: typeof SELECT_APIKEY_BASIC }>;

export class ApiKeyRepository extends BaseRepository {
  async findById(id: string): Promise<ApiKeyBasic | null> {
    return prisma.apiKey.findUnique({
      where: { id },
      select: SELECT_APIKEY_BASIC,
    });
  }

  async findByUserId(userId: string): Promise<ApiKeyBasic | null> {
    return prisma.apiKey.findUnique({
      where: { userId },
      select: SELECT_APIKEY_BASIC,
    });
  }

  async findByKey(key: string): Promise<ApiKeyBasic & { key: string } | null> {
    return prisma.apiKey.findFirst({
      where: { key },
      select: {
        ...SELECT_APIKEY_BASIC,
        key: true,
      },
    });
  }

  async create(data: {
    userId: string;
    name: string;
    permissions: string[];
    expiresAt?: Date | null;
  }): Promise<{ apiKey: ApiKeyBasic; plainKey: string }> {
    // Generate a random API key
    const plainKey = `tl_${crypto.randomBytes(32).toString("hex")}`;
    const keyPrefix = plainKey.substring(0, 12);
    const hashedKey = this.hashKey(plainKey);

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: data.userId,
        key: hashedKey,
        keyPrefix,
        name: data.name,
        permissions: data.permissions as any,
        expiresAt: data.expiresAt,
      },
      select: SELECT_APIKEY_BASIC,
    });

    return { apiKey, plainKey };
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      permissions: string[];
      isActive: boolean;
      expiresAt: Date | null;
    }>
  ): Promise<ApiKeyBasic | null> {
    return prisma.apiKey.update({
      where: { id },
      data: {
        ...data,
        permissions: data.permissions as any,
      },
      select: SELECT_APIKEY_BASIC,
    });
  }

  async updateLastUsed(id: string): Promise<void> {
    await prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.apiKey.delete({ where: { id } });
  }

  async regenerate(userId: string, name: string, permissions: string[]): Promise<{ apiKey: ApiKeyBasic; plainKey: string }> {
    // Delete existing key if any
    await prisma.apiKey.deleteMany({ where: { userId } });

    // Create new key
    return this.create({ userId, name, permissions });
  }

  async verifyKey(plainKey: string): Promise<ApiKeyBasic | null> {
    const hashedKey = this.hashKey(plainKey);

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        key: hashedKey,
        isActive: true,
      },
      select: SELECT_APIKEY_BASIC,
    });

    if (!apiKey) return null;

    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    return apiKey;
  }

  private hashKey(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex");
  }

  async findAll(options?: {
    where?: Prisma.ApiKeyWhereInput;
    orderBy?: Prisma.ApiKeyOrderByWithRelationInput;
    page?: number;
    limit?: number;
  }) {
    const { where, orderBy, page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.apiKey.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: SELECT_APIKEY_BASIC,
      }),
      prisma.apiKey.count({ where }),
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

export const apiKeyRepository = new ApiKeyRepository();