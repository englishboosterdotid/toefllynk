import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { TierServiceClass } from "@/lib/services/TierService";

const calculateWithdrawalFee = (amount: number, withdrawalFeeRate: number) => {
  return Math.floor(amount * (withdrawalFeeRate / 100));
};

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, bankName, bankAccount, bankHolder } = body;

    // Validate required fields
    if (!amount || !bankName || !bankAccount || !bankHolder) {
      return NextResponse.json(
        { error: "All bank details are required" },
        { status: 400 }
      );
    }

    // Parse amount
    const withdrawalAmount = parseInt(amount);

    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid withdrawal amount" },
        { status: 400 }
      );
    }

    // Get tier for minimum withdrawal
    const userWithTier = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { sellerTier: true },
    });
    const minimumWithdrawal = TierServiceClass.getMinimumWithdrawal(userWithTier?.sellerTier || "FREE");

    // Check minimum amount based on tier
    if (withdrawalAmount < minimumWithdrawal) {
      return NextResponse.json(
        { error: `Minimum withdrawal is Rp ${minimumWithdrawal.toLocaleString("id-ID")}` },
        { status: 400 }
      );
    }

    // Calculate balance same as GET endpoint - parallel queries for better performance
    const [
      affiliateEarnings,
      ownerOrders,
      withdrawals,
      pendingWithdrawals
    ] = await Promise.all([
      // Get affiliate earnings from selling others' products
      prisma.affiliateConversion.aggregate({
        where: { affiliateUserId: session.userId },
        _sum: { commissionAmount: true },
      }),
      // Get own product sales (Gross - Affiliate Commission - Platform Fee)
      prisma.order.findMany({
        where: {
          product: { userId: session.userId },
          status: "COMPLETED",
        },
        include: {
          product: { select: { price: true, promoPrice: true } },
          adminFee: true,
          affiliateConversion: true,
        },
      }),
      // Get processed withdrawals
      prisma.withdrawalRequest.aggregate({
        where: {
          userId: session.userId,
          status: { in: ["APPROVED", "COMPLETED"] },
        },
        _sum: { amount: true },
      }),
      // Get pending withdrawals
      prisma.withdrawalRequest.aggregate({
        where: {
          userId: session.userId,
          status: "PENDING",
        },
        _sum: { amount: true },
      }),
    ]);

    const totalAffiliateEarnings = affiliateEarnings._sum.commissionAmount || 0;
    const grossRevenue = ownerOrders.reduce(
      (sum, o) => sum + (o.product?.promoPrice || o.product?.price || 0),
      0
    );
    const totalAffiliateCommission = ownerOrders.reduce(
      (sum, o) => sum + (o.affiliateConversion?.commissionAmount || 0),
      0
    );
    const platformFees = ownerOrders.reduce(
      (sum, o) => sum + (o.adminFee?.feeAmount || 0),
      0
    );
    const netOwnSales = grossRevenue - totalAffiliateCommission - platformFees;
    const totalWithdrawn = withdrawals._sum.amount || 0;
    const pendingAmount = pendingWithdrawals._sum.amount || 0;

    // Available = Net Own Sales - Dicairkan - Pending + Affiliate Earnings
    const availableBalance = netOwnSales - totalWithdrawn - pendingAmount + totalAffiliateEarnings;

    // Check if user has sufficient balance
    if (withdrawalAmount > availableBalance) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Available: Rp ${availableBalance.toLocaleString("id-ID")}`,
        },
        { status: 400 }
      );
    }

    // Calculate withdrawal fee based on user tier (reuse userWithTier from above)
    const withdrawalFeeRate = TierServiceClass.getWithdrawalFee(userWithTier?.sellerTier || "FREE");
    const feeAmount = calculateWithdrawalFee(withdrawalAmount, withdrawalFeeRate);
    const netAmount = withdrawalAmount - feeAmount;

    // Create withdrawal request
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        userId: session.userId,
        amount: withdrawalAmount,
        feeAmount,
        netAmount,
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        bankHolder: bankHolder.trim(),
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully",
      data: {
        id: withdrawalRequest.id,
        amount: withdrawalRequest.amount,
        feeAmount: withdrawalRequest.feeAmount,
        netAmount: withdrawalRequest.netAmount,
        status: withdrawalRequest.status,
        createdAt: withdrawalRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parallel queries for better performance
    const [
      withdrawalRequests,
      affiliateEarnings,
      ownerOrders,
      processedWithdrawals,
      pendingWithdrawals,
      userWithTier
    ] = await Promise.all([
      // Get all withdrawal requests for this user
      prisma.withdrawalRequest.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
      }),
      // Calculate AFFILIATE earnings (from selling others' products)
      prisma.affiliateConversion.aggregate({
        where: { affiliateUserId: session.userId },
        _sum: { commissionAmount: true },
      }),
      // Calculate OWN PRODUCT earnings (from selling own products)
      prisma.order.findMany({
        where: {
          product: { userId: session.userId },
          status: "COMPLETED",
        },
        include: {
          product: { select: { price: true, promoPrice: true } },
          adminFee: true,
          affiliateConversion: true,
        },
      }),
      // Calculate withdrawals (using netAmount - what user actually receives)
      prisma.withdrawalRequest.aggregate({
        where: {
          userId: session.userId,
          status: "COMPLETED",
        },
        _sum: { netAmount: true },
      }),
      // Get pending withdrawals
      prisma.withdrawalRequest.aggregate({
        where: {
          userId: session.userId,
          status: "PENDING",
        },
        _sum: { netAmount: true },
      }),
      // Get user tier for withdrawal fee rate
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { sellerTier: true },
      }),
    ]);

    const totalAffiliateEarnings = affiliateEarnings._sum.commissionAmount || 0;
    const grossRevenue = ownerOrders.reduce(
      (sum, o) => sum + (o.product?.promoPrice || o.product?.price || 0),
      0
    );
    const totalAffiliateCommission = ownerOrders.reduce(
      (sum, o) => sum + (o.affiliateConversion?.commissionAmount || 0),
      0
    );
    const platformFees = ownerOrders.reduce(
      (sum, o) => sum + (o.adminFee?.feeAmount || 0),
      0
    );
    const netOwnSales = grossRevenue - totalAffiliateCommission - platformFees;
    const totalWithdrawn = processedWithdrawals._sum.netAmount || 0;
    const pendingAmount = pendingWithdrawals._sum.netAmount || 0;
    // availableBalance = netOwnSales - sudah dicairkan - pending + komisi affiliate (dari produk orang lain)
    const availableBalance = netOwnSales - totalWithdrawn - pendingAmount + totalAffiliateEarnings;
    const withdrawalFeeRate = TierServiceClass.getWithdrawalFee(userWithTier?.sellerTier || "FREE");
    const minimumWithdrawal = TierServiceClass.getMinimumWithdrawal(userWithTier?.sellerTier || "FREE");

    return NextResponse.json({
      success: true,
      data: {
        tier: userWithTier?.sellerTier || "FREE",
        withdrawalFeeRate,
        minimumWithdrawal,
        balance: {
          grossRevenue,
          totalAffiliateCommission,
          netOwnSales,
          platformFees,
          totalAffiliateEarnings,
          totalWithdrawn,
          pendingAmount,
          availableBalance,
        },
        requests: withdrawalRequests,
      },
    });
  } catch (error) {
    console.error("Get withdrawals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}