import { emailCampaignRepository, type CampaignBasic } from "@/lib/repositories";
import { TierServiceClass } from "@/lib/services/TierService";
import { SellerTier } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

export interface EmailCampaignWithStats extends CampaignBasic {
  openRate: number;
  clickRate: number;
}

export interface EmailQuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
}

export async function getEmailQuota(userId: string): Promise<EmailQuotaInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sellerTier: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const tierConfig = TierServiceClass.getConfig(user.sellerTier as SellerTier);
  const limit = tierConfig.emailMarketingLimit;

  // Get total sent this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const campaigns = await emailCampaignRepository.findAll({
    where: {
      userId,
      sentAt: { gte: startOfMonth },
    },
    limit: 1000,
  });

  const used = campaigns.data.reduce((sum, c) => sum + c.sentCount, 0);

  return {
    used,
    limit,
    remaining: limit === -1 ? -1 : Math.max(0, limit - used),
    isUnlimited: limit === -1,
  };
}

export async function checkEmailQuota(userId: string, count: number): Promise<{
  allowed: boolean;
  error?: string;
}> {
  const quota = await getEmailQuota(userId);

  if (quota.isUnlimited) {
    return { allowed: true };
  }

  if (quota.remaining < count) {
    return {
      allowed: false,
      error: `Kuota email habis.剩余: ${quota.remaining}, 但需要: ${count}. Upgrade ke tier lebih tinggi untuk menambah kuota.`,
    };
  }

  return { allowed: true };
}

export async function createCampaign(
  userId: string,
  data: {
    name: string;
    subject: string;
    template?: string | null;
    scheduledAt?: Date | null;
  }
): Promise<{ success: boolean; campaign?: CampaignBasic; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sellerTier: true },
    });

    if (!user) {
      return { success: false, error: "User tidak ditemukan" };
    }

    const tierConfig = TierServiceClass.getConfig(user.sellerTier as SellerTier);

    if (tierConfig.emailMarketingLimit === 0) {
      return { success: false, error: "Email marketing tidak tersedia untuk tier ini" };
    }

    const campaign = await emailCampaignRepository.create({
      userId,
      ...data,
    });

    return { success: true, campaign };
  } catch (error) {
    console.error("Create campaign error:", error);
    return { success: false, error: "Terjadi kesalahan saat membuat campaign" };
  }
}

export async function updateCampaign(
  campaignId: string,
  userId: string,
  data: {
    name?: string;
    subject?: string;
    template?: string | null;
    status?: string;
    scheduledAt?: Date | null;
  }
): Promise<{ success: boolean; campaign?: CampaignBasic; error?: string }> {
  try {
    const campaign = await emailCampaignRepository.findById(campaignId);

    if (!campaign) {
      return { success: false, error: "Campaign tidak ditemukan" };
    }

    // Only allow editing drafts
    if (campaign.status !== "DRAFT") {
      return { success: false, error: "Hanya campaign dengan status DRAFT yang bisa diedit" };
    }

    const updated = await emailCampaignRepository.update(campaignId, data);

    return { success: true, campaign: updated || undefined };
  } catch (error) {
    console.error("Update campaign error:", error);
    return { success: false, error: "Terjadi kesalahan saat update campaign" };
  }
}

export async function getCampaignsByUser(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ success: boolean; campaigns?: CampaignBasic[]; pagination?: any; error?: string }> {
  try {
    const result = await emailCampaignRepository.findByUserId(userId, page, limit);

    return {
      success: true,
      campaigns: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  } catch (error) {
    console.error("Get campaigns error:", error);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function getCampaignById(
  campaignId: string
): Promise<{ success: boolean; campaign?: EmailCampaignWithStats; error?: string }> {
  try {
    const campaign = await emailCampaignRepository.findById(campaignId);

    if (!campaign) {
      return { success: false, error: "Campaign tidak ditemukan" };
    }

    const openRate = campaign.sentCount > 0 ? (campaign.openCount / campaign.sentCount) * 100 : 0;
    const clickRate = campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount) * 100 : 0;

    return {
      success: true,
      campaign: {
        ...campaign,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
      },
    };
  } catch (error) {
    console.error("Get campaign error:", error);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function deleteCampaign(
  campaignId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const campaign = await emailCampaignRepository.findById(campaignId);

    if (!campaign) {
      return { success: false, error: "Campaign tidak ditemukan" };
    }

    // Only allow deleting drafts or sent campaigns
    if (campaign.status === "SENDING") {
      return { success: false, error: "Tidak bisa hapus campaign yang sedang dikirim" };
    }

    await emailCampaignRepository.delete(campaignId);

    return { success: true };
  } catch (error) {
    console.error("Delete campaign error:", error);
    return { success: false, error: "Terjadi kesalahan saat hapus campaign" };
  }
}

export async function sendCampaign(
  campaignId: string,
  recipients: Array<{ email: string; name?: string }>
): Promise<{ success: boolean; sent?: number; error?: string }> {
  try {
    const campaign = await emailCampaignRepository.findById(campaignId);

    if (!campaign) {
      return { success: false, error: "Campaign tidak ditemukan" };
    }

    if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
      return { success: false, error: "Campaign tidak bisa dikirim" };
    }

    // Check quota
    const quotaCheck = await checkEmailQuota(campaign.userId, recipients.length);
    if (!quotaCheck.allowed) {
      return { success: false, error: quotaCheck.error };
    }

    // Update status to SENDING
    await emailCampaignRepository.update(campaignId, { status: "SENDING" });

    // Simulate sending (in production, integrate with email provider)
    // For now, just update the stats
    const sent = Math.min(recipients.length, quotaCheck.allowed ? recipients.length : 0);

    await emailCampaignRepository.update(campaignId, {
      status: "SENT",
      sentAt: new Date(),
      sentCount: sent,
      deliveredCount: sent,
    });

    return { success: true, sent };
  } catch (error) {
    console.error("Send campaign error:", error);
    return { success: false, error: "Terjadi kesalahan saat kirim campaign" };
  }
}

// Template helpers
export const EMAIL_TEMPLATES = {
  welcome: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1e40af;">Selamat Datang!</h1>
      <p>Halo {{name}},</p>
      <p>Terima kasih telah bergabung. Kami sangat senang bisa membantu Anda.</p>
      <a href="{{cta_url}}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Mulai Sekarang</a>
    </div>
  `,
  orderConfirmation: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1e40af;">Pesanan Dikonfirmasi</h1>
      <p>Halo {{name}},</p>
      <p>Pesanan Anda telah dikonfirmasi:</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Produk:</strong> {{product_name}}</p>
        <p><strong>Total:</strong> {{total_amount}}</p>
      </div>
      <a href="{{dashboard_url}}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Lihat Dashboard</a>
    </div>
  `,
  newsletter: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1e40af;">{{subject}}</h1>
      <p>Halo {{name}},</p>
      {{content}}
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #6b7280;">
        Anda menerima email ini karena terdaftar di platform kami.
        <a href="{{unsubscribe_url}}">Unsubscribe</a>
      </p>
    </div>
  `,
} as const;

export type EmailTemplateType = keyof typeof EMAIL_TEMPLATES;

export function getTemplate(type: EmailTemplateType): string {
  return EMAIL_TEMPLATES[type];
}

export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}