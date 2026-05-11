import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function PUT(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bankName, bankAccount, bankHolder } = body;

    if (!bankName || !bankAccount || !bankHolder) {
      return NextResponse.json(
        { error: "All bank details are required" },
        { status: 400 }
      );
    }

    // Update user's bank info via BankAccount
    await prisma.bankAccount.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        bankHolder: bankHolder.trim(),
      },
      update: {
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        bankHolder: bankHolder.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bank information updated successfully",
      data: {
        bankName,
        bankAccount,
        bankHolder,
      },
    });
  } catch (error) {
    console.error("Update bank info error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bankInfo = await prisma.bankAccount.findUnique({
      where: { userId: session.userId },
    });

    return NextResponse.json({
      success: true,
      data: bankInfo,
    });
  } catch (error) {
    console.error("Get bank info error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}