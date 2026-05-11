import { supportRepository, type TicketBasic } from "@/lib/repositories";
import { TierServiceClass } from "@/lib/services/TierService";
import { SellerTier, TicketPriority, TicketStatus } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

export interface TicketWithStats extends TicketBasic {
  responseTime?: number; // hours
}

const TICKET_CATEGORIES = [
  { id: "GENERAL", label: "General", description: "General questions and inquiries" },
  { id: "BUG", label: "Bug Report", description: "Report a technical issue or bug" },
  { id: "FEATURE", label: "Feature Request", description: "Suggest a new feature" },
  { id: "BILLING", label: "Billing", description: "Payment and billing related issues" },
  { id: "ACCOUNT", label: "Account", description: "Account access and settings" },
  { id: "TECHNICAL", label: "Technical Support", description: "Technical help and guidance" },
];

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

// Support tiers - who can access support (FREE tier gets community support)
const SUPPORT_TIER_ACCESS = {
  FREE: "community",
  BASIC: "email",
  PRO: "email",
  BUSINESS: "priority",
} as const;

export function getTicketCategories() {
  return TICKET_CATEGORIES;
}

export function getPriorityLabel(priority: string): string {
  return PRIORITY_LABELS[priority] || priority;
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

export async function createTicket(
  userId: string,
  data: {
    subject: string;
    message: string;
    category: string;
    priority?: TicketPriority;
  }
): Promise<{ success: boolean; ticket?: TicketBasic; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profile: { select: { sellerTier: true } } },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const ticket = await supportRepository.create({
      userId,
      subject: data.subject,
      message: data.message,
      category: data.category,
      priority: data.priority || ("NORMAL" as TicketPriority),
    });

    return { success: true, ticket };
  } catch (error) {
    console.error("Create ticket error:", error);
    return { success: false, error: "Terjadi kesalahan saat membuat tiket" };
  }
}

export async function getTicketsByUser(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ success: boolean; tickets?: TicketBasic[]; pagination?: any; error?: string }> {
  try {
    const result = await supportRepository.findByUserId(userId, page, limit);

    return {
      success: true,
      tickets: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  } catch (error) {
    console.error("Get tickets error:", error);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function getTicketById(
  ticketId: string
): Promise<{ success: boolean; ticket?: TicketBasic; error?: string }> {
  try {
    const ticket = await supportRepository.findById(ticketId);

    if (!ticket) {
      return { success: false, error: "Tiket tidak ditemukan" };
    }

    return { success: true, ticket };
  } catch (error) {
    console.error("Get ticket error:", error);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function updateTicketStatus(
  ticketId: string,
  userId: string,
  status: TicketStatus
): Promise<{ success: boolean; ticket?: TicketBasic; error?: string }> {
  try {
    const ticket = await supportRepository.findById(ticketId);

    if (!ticket) {
      return { success: false, error: "Tiket tidak ditemukan" };
    }

    // Only ticket owner can close their ticket
    if (ticket.userId !== userId && status === "CLOSED") {
      return { success: false, error: "Unauthorized" };
    }

    const updated = await supportRepository.update(ticketId, { status });

    return { success: true, ticket: updated || undefined };
  } catch (error) {
    console.error("Update ticket error:", error);
    return { success: false, error: "Terjadi kesalahan saat update tiket" };
  }
}

export async function addTicketResponse(
  ticketId: string,
  userId: string,
  responseMessage: string
): Promise<{ success: boolean; ticket?: TicketBasic; error?: string }> {
  try {
    const ticket = await supportRepository.findById(ticketId);

    if (!ticket) {
      return { success: false, error: "Tiket tidak ditemukan" };
    }

    // Only ticket owner can add response
    if (ticket.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if status is CLOSED
    if (ticket.status === "CLOSED") {
      return { success: false, error: "Tiket sudah ditutup" };
    }

    const updated = await supportRepository.update(ticketId, {
      status: "IN_PROGRESS" as TicketStatus,
      responseMessage,
    });

    return { success: true, ticket: updated || undefined };
  } catch (error) {
    console.error("Add response error:", error);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function getOpenTicketCount(userId: string): Promise<number> {
  return supportRepository.countOpenByUser(userId);
}

// Get support tier info for UI
export async function getSupportTierInfo(userId: string): Promise<{
  supportLevel: "community" | "email" | "priority";
  responseTime: string;
  canCreateTicket: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profile: { select: { sellerTier: true } } },
  });

  if (!user) {
    return {
      supportLevel: "community",
      responseTime: "Community forum",
      canCreateTicket: false,
    };
  }

  const tierConfig = TierServiceClass.getConfig(user.profile?.sellerTier || "FREE");

  return {
    supportLevel: tierConfig.supportLevel,
    responseTime: tierConfig.supportLevel === "priority"
      ? "24-48 hours"
      : tierConfig.supportLevel === "email"
        ? "2-3 business days"
        : "Community forum",
    canCreateTicket: user.profile?.sellerTier !== "FREE" || true, // Everyone can create tickets, but FREE gets community support only
  };
}