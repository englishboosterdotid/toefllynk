import { customerRepository, type CustomerBasic } from "@/lib/repositories";
import { TierServiceClass } from "@/lib/services/TierService";
import { SellerTier } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

export interface CustomerWithOrders extends CustomerBasic {
  orders: Array<{
    id: string;
    createdAt: Date;
    status: string;
    product: { id: string; title: string; price: number };
  }>;
}

export interface CustomerListResult {
  data: CustomerBasic[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  canAddMore: boolean;
  limitMessage?: string;
}

// Helper function to get user tier
async function getUserTier(userId: string): Promise<SellerTier> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sellerTier: true },
  });
  return (user?.sellerTier || "FREE") as SellerTier;
}

export async function getCustomersByOwner(
  userId: string,
  page = 1,
  limit = 20,
  search?: string
): Promise<CustomerListResult> {
  // Get user tier for limit
  const userTier = await getUserTier(userId);
  const tierConfig = TierServiceClass.getConfig(userTier);

  // Get customer count for limit check
  const currentCount = await customerRepository.countByOwnerUser(userId);
  const maxCustomers = tierConfig.customerDatabaseLimit;

  if (maxCustomers !== -1 && currentCount >= maxCustomers && !search) {
    return {
      data: [],
      total: currentCount,
      page,
      limit,
      totalPages: Math.ceil(currentCount / limit),
      canAddMore: false,
      limitMessage: `Batas customer tercapai (${currentCount}/${maxCustomers}). Upgrade ke tier lebih tinggi untuk menambah customer.`,
    };
  }

  const result = await customerRepository.findByOwnerUser(userId, page, limit, search);

  return {
    ...result,
    canAddMore: maxCustomers === -1 || currentCount < maxCustomers,
  };
}

export async function getCustomerById(id: string, userId: string): Promise<CustomerWithOrders | null> {
  const customer = await customerRepository.findByIdWithOrders(id);

  if (!customer) return null;

  // Verify ownership
  const ownerCheck = await prisma.customer.findUnique({
    where: { id },
    select: { ownerUserId: true },
  });

  if (!ownerCheck || ownerCheck.ownerUserId !== userId) {
    return null;
  }

  return customer;
}

export async function createCustomer(
  userId: string,
  data: {
    buyerName: string;
    buyerEmail: string;
    buyerPhone?: string | null;
    buyerAddress?: string | null;
    tags?: string | null;
  }
): Promise<{ success: boolean; customer?: CustomerBasic; error?: string }> {
  try {
    // Get user tier for limit check
    const userTier = await getUserTier(userId);
    const tierConfig = TierServiceClass.getConfig(userTier);

    const currentCount = await customerRepository.countByOwnerUser(userId);

    if (tierConfig.customerDatabaseLimit !== -1 && currentCount >= tierConfig.customerDatabaseLimit) {
      return {
        success: false,
        error: `Batas customer tercapai (${currentCount}/${tierConfig.customerDatabaseLimit}). Upgrade ke tier lebih tinggi.`,
      };
    }

    // Check if email already exists in our system
    const existing = await customerRepository.findByEmail(data.buyerEmail);
    if (existing) {
      return {
        success: false,
        error: "Customer dengan email ini sudah ada",
      };
    }

    const customer = await customerRepository.create({
      ownerUserId: userId,
      ...data,
    });

    return { success: true, customer };
  } catch (error) {
    console.error("Create customer error:", error);
    return { success: false, error: "Terjadi kesalahan saat membuat customer" };
  }
}

export async function updateCustomer(
  customerId: string,
  userId: string,
  data: Partial<{
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string | null;
    buyerAddress: string | null;
    notes: string | null;
    tags: string | null;
  }>
): Promise<{ success: boolean; customer?: CustomerBasic; error?: string }> {
  try {
    // Verify ownership
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      return { success: false, error: "Customer tidak ditemukan" };
    }

    // Update
    const updated = await customerRepository.update(customerId, data);

    return { success: true, customer: updated || undefined };
  } catch (error) {
    console.error("Update customer error:", error);
    return { success: false, error: "Terjadi kesalahan saat update customer" };
  }
}

export async function deleteCustomer(
  customerId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify ownership
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      return { success: false, error: "Customer tidak ditemukan" };
    }

    await customerRepository.delete(customerId);

    return { success: true };
  } catch (error) {
    console.error("Delete customer error:", error);
    return { success: false, error: "Terjadi kesalahan saat menghapus customer" };
  }
}

export async function upsertCustomerFromOrder(
  ownerUserId: string,
  orderData: {
    buyerName: string;
    buyerEmail: string;
    buyerWhatsapp?: string | null;
    productPrice: number;
  }
): Promise<CustomerBasic | null> {
  return customerRepository.upsertFromOrder(ownerUserId, orderData);
}

export async function exportCustomers(
  userId: string,
  format: "csv" | "json" = "csv"
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    // Check tier - PRO+ only
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sellerTier: true },
    });

    if (!user) {
      return { success: false, error: "User tidak ditemukan" };
    }

    const tierConfig = TierServiceClass.getConfig(user.sellerTier as SellerTier);
    if (!tierConfig.hasExportCustomer) {
      return { success: false, error: "Fitur export customer hanya untuk PRO+" };
    }

    const customers = await customerRepository.findAll({
      where: { ownerUserId: userId },
      limit: 10000, // Max export 10k
    });

    if (format === "json") {
      return {
        success: true,
        data: JSON.stringify(customers.data, null, 2),
      };
    }

    // CSV format
    const headers = ["ID", "Nama", "Email", "Telepon", "Alamat", "Total Pembelian", "Total Belanja", "Tags", "Created At"];
    const rows = customers.data.map((c) => [
      c.id,
      c.buyerName,
      c.buyerEmail,
      c.buyerPhone || "",
      c.buyerAddress || "",
      c.totalPurchases,
      c.totalSpent,
      c.tags || "",
      c.createdAt.toISOString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return { success: true, data: csv };
  } catch (error) {
    console.error("Export customers error:", error);
    return { success: false, error: "Terjadi kesalahan saat export" };
  }
}