import { apiKeyRepository, type ApiKeyBasic } from "@/lib/repositories";
import { TierServiceClass } from "@/lib/services/TierService";
import { SellerTier } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

export interface CreateApiKeyResult {
  success: boolean;
  apiKey?: ApiKeyBasic;
  plainKey?: string;
  error?: string;
}

export const API_PERMISSIONS = {
  READ_PRODUCTS: "read:products",
  WRITE_PRODUCTS: "write:products",
  READ_ORDERS: "read:orders",
  WRITE_ORDERS: "write:orders",
  READ_CUSTOMERS: "read:customers",
  WRITE_CUSTOMERS: "write:customers",
  READ_ANALYTICS: "read:analytics",
  READ_WITHDRAWALS: "read:withdrawals",
} as const;

export type ApiPermission = (typeof API_PERMISSIONS)[keyof typeof API_PERMISSIONS];

export async function checkApiAccess(
  userId: string,
  permission: ApiPermission
): Promise<{ hasAccess: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profile: { select: { sellerTier: true } } },
    });

    if (!user) {
      return { hasAccess: false, error: "User tidak ditemukan" };
    }

    const tierConfig = TierServiceClass.getConfig(user.profile?.sellerTier as SellerTier);

    if (!tierConfig.hasAPIAccess) {
      return { hasAccess: false, error: "Fitur API hanya untuk PRO+" };
    }

    // Check if user has active API key
    const apiKey = await apiKeyRepository.findByUserId(userId);

    if (!apiKey || !apiKey.isActive) {
      return { hasAccess: false, error: "API key belum dibuat atau nonaktif" };
    }

    // Check permission in API key
    const permissions = apiKey.permissions as string[];
    if (!permissions.includes(permission)) {
      return { hasAccess: false, error: `Permission ${permission} tidak diizinkan` };
    }

    return { hasAccess: true };
  } catch (error) {
    console.error("Check API access error:", error);
    return { hasAccess: false, error: "Terjadi kesalahan" };
  }
}

export async function createApiKey(
  userId: string,
  data: {
    name: string;
    permissions: ApiPermission[];
    expiresAt?: Date | null;
  }
): Promise<CreateApiKeyResult> {
  try {
    // Check tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profile: { select: { sellerTier: true } } },
    });

    if (!user) {
      return { success: false, error: "User tidak ditemukan" };
    }

    const tierConfig = TierServiceClass.getConfig(user.profile?.sellerTier as SellerTier);

    if (!tierConfig.hasAPIAccess) {
      return { success: false, error: "Fitur API hanya untuk PRO+" };
    }

    // Check if key already exists
    const existing = await apiKeyRepository.findByUserId(userId);
    if (existing) {
      return { success: false, error: "API key sudah ada. Gunakan regenerate untuk membuat baru." };
    }

    // Create new key
    const result = await apiKeyRepository.create({
      userId,
      name: data.name,
      permissions: data.permissions,
      expiresAt: data.expiresAt,
    });

    return {
      success: true,
      apiKey: result.apiKey,
      plainKey: result.plainKey,
    };
  } catch (error) {
    console.error("Create API key error:", error);
    return { success: false, error: "Terjadi kesalahan saat membuat API key" };
  }
}

export async function regenerateApiKey(
  userId: string,
  name: string,
  permissions: ApiPermission[]
): Promise<CreateApiKeyResult> {
  try {
    // Check tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profile: { select: { sellerTier: true } } },
    });

    if (!user) {
      return { success: false, error: "User tidak ditemukan" };
    }

    const tierConfig = TierServiceClass.getConfig(user.profile?.sellerTier as SellerTier);

    if (!tierConfig.hasAPIAccess) {
      return { success: false, error: "Fitur API hanya untuk PRO+" };
    }

    const result = await apiKeyRepository.regenerate(userId, name, permissions);

    return {
      success: true,
      apiKey: result.apiKey,
      plainKey: result.plainKey,
    };
  } catch (error) {
    console.error("Regenerate API key error:", error);
    return { success: false, error: "Terjadi kesalahan saat regenerate API key" };
  }
}

export async function getApiKey(userId: string): Promise<ApiKeyBasic | null> {
  return apiKeyRepository.findByUserId(userId);
}

export async function updateApiKey(
  userId: string,
  data: {
    name?: string;
    permissions?: ApiPermission[];
    isActive?: boolean;
    expiresAt?: Date | null;
  }
): Promise<{ success: boolean; apiKey?: ApiKeyBasic; error?: string }> {
  try {
    const existing = await apiKeyRepository.findByUserId(userId);

    if (!existing) {
      return { success: false, error: "API key tidak ditemukan" };
    }

    const updated = await apiKeyRepository.update(existing.id, data);

    return { success: true, apiKey: updated || undefined };
  } catch (error) {
    console.error("Update API key error:", error);
    return { success: false, error: "Terjadi kesalahan saat update API key" };
  }
}

export async function deleteApiKey(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await apiKeyRepository.findByUserId(userId);

    if (!existing) {
      return { success: false, error: "API key tidak ditemukan" };
    }

    await apiKeyRepository.delete(existing.id);

    return { success: true };
  } catch (error) {
    console.error("Delete API key error:", error);
    return { success: false, error: "Terjadi kesalahan saat hapus API key" };
  }
}

export async function verifyApiKey(
  plainKey: string
): Promise<{ valid: boolean; apiKey?: ApiKeyBasic; error?: string }> {
  try {
    const result = await apiKeyRepository.verifyKey(plainKey);

    if (!result) {
      return { valid: false, error: "API key tidak valid atau expired" };
    }

    // Update last used
    await apiKeyRepository.updateLastUsed(result.id);

    return { valid: true, apiKey: result };
  } catch (error) {
    console.error("Verify API key error:", error);
    return { valid: false, error: "Terjadi kesalahan saat verifikasi" };
  }
}

// Middleware helper for API routes
export async function requireApiKey(req: Request): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Authorization header required" };
  }

  const plainKey = authHeader.substring(7);

  const result = await verifyApiKey(plainKey);

  if (!result.valid) {
    return { valid: false, error: result.error };
  }

  return { valid: true, userId: result.apiKey!.userId };
}