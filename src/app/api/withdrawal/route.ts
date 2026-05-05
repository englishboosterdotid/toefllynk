import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const MINIMUM_WITHDRAWAL = 50000; // Rp 50.000 minimum
const WITHDRAWAL_FEE_PERCENT = 1; // 1% fee

const calculateWithdrawalFee = (amount: number) => {
  return Math.floor(amount * (WITHDRAWAL_FEE_PERCENT / 100));
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

    // Check minimum amount
    if (withdrawalAmount < MINIMUM_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Minimum withdrawal is Rp ${MINIMUM_WITHDRAWAL.toLocaleString("id-ID")}` },
        { status: 400 }
      );
    }

    // Calculate balance same as GET endpoint
    // Get affiliate earnings from selling others' products
    const affiliateEarnings = await prisma.affiliateConversion.aggregate({
      where: { affiliateUserId: session.userId },
      _sum: { commissionAmount: true },
    });
    const totalAffiliateEarnings = affiliateEarnings._sum.commissionAmount || 0;

    // Get own product sales (Gross - Affiliate Commission - Platform Fee)
    const ownerOrders = await prisma.order.findMany({
      where: {
        product: { userId: session.userId },
        status: "COMPLETED",
      },
      include: {
        product: { select: { price: true, promoPrice: true } },
        adminFee: true,
        affiliateConversion: true,
      },
    });

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

    // Get withdrawals
    const withdrawals = await prisma.withdrawalRequest.aggregate({
      where: {
        userId: session.userId,
        status: { in: ["APPROVED", "COMPLETED"] },
      },
      _sum: { amount: true },
    });
    const totalWithdrawn = withdrawals._sum.amount || 0;

    const pendingWithdrawals = await prisma.withdrawalRequest.aggregate({
      where: {
        userId: session.userId,
        status: "PENDING",
      },
      _sum: { amount: true },
    });
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

    // Calculate withdrawal fee (1%)
    const feeAmount = calculateWithdrawalFee(withdrawalAmount);
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

    // Get all withdrawal requests for this user
    const withdrawalRequests = await prisma.withdrawalRequest.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    // Calculate AFFILIATE earnings (from selling others' products)
    const affiliateEarnings = await prisma.affiliateConversion.aggregate({
      where: { affiliateUserId: session.userId },
      _sum: { commissionAmount: true },
    });

    const totalAffiliateEarnings = affiliateEarnings._sum.commissionAmount || 0;

    // Calculate OWN PRODUCT earnings (from selling own products)
    const ownerOrders = await prisma.order.findMany({
      where: {
        product: { userId: session.userId },
        status: "COMPLETED",
      },
      include: {
        product: { select: { price: true, promoPrice: true } },
        adminFee: true,
        affiliateConversion: true,
      },
    });

    const grossRevenue = ownerOrders.reduce(
      (sum, o) => sum + (o.product?.promoPrice || o.product?.price || 0),
      0
    );

    // Commission paid to affiliates when selling own products
    const totalAffiliateCommission = ownerOrders.reduce(
      (sum, o) => sum + (o.affiliateConversion?.commissionAmount || 0),
      0
    );

    const platformFees = ownerOrders.reduce(
      (sum, o) => sum + (o.adminFee?.feeAmount || 0),
      0
    );

    // Calculate withdrawals (using netAmount - what user actually receives)
    const processedWithdrawals = await prisma.withdrawalRequest.aggregate({
      where: {
        userId: session.userId,
        status: "COMPLETED",
      },
      _sum: { netAmount: true },
    });

    const totalWithdrawn = processedWithdrawals._sum.netAmount || 0;

    const pendingWithdrawals = await prisma.withdrawalRequest.aggregate({
      where: {
        userId: session.userId,
        status: "PENDING",
      },
      _sum: { netAmount: true },
    });

    const pendingAmount = pendingWithdrawals._sum.netAmount || 0;

    // Available = (Gross - Affiliate Commission - Platform Fee) - Dicairkan - Pending + Affiliate Earnings
    // netOwnSales = Gross - Affiliate Commission (yg dibayar oleh user ke affiliator) - Platform Fee
    const netOwnSales = grossRevenue - totalAffiliateCommission - platformFees;
    // availableBalance = netOwnSales - sudah dicairkan - pending + komisi affiliate (dari produk orang lain)
    const availableBalance = netOwnSales - totalWithdrawn - pendingAmount + totalAffiliateEarnings;

    return NextResponse.json({
      success: true,
      data: {
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