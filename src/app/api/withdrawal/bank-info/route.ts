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

    // Update user's bank info
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        bankHolder: bankHolder.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bank information updated successfully",
      data: {
        bankName: user.bankName,
        bankAccount: user.bankAccount,
        bankHolder: user.bankHolder,
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

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        bankName: true,
        bankAccount: true,
        bankHolder: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get bank info error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}