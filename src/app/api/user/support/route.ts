import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromCookie } from "@/lib/auth";
import { getTicketsByUser, createTicket, getOpenTicketCount } from "@/lib/services/supportService";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const user = await getUserFromCookie(cookieStore);

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await getTicketsByUser(user.id, page, limit);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    const openCount = await getOpenTicketCount(user.id);

    return NextResponse.json({
      success: true,
      tickets: result.tickets,
      pagination: result.pagination,
      openCount,
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const user = await getUserFromCookie(cookieStore);

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, message, category, priority } = body;

    if (!subject || !message || !category) {
      return NextResponse.json({
        success: false,
        message: "Subject, message, dan category harus diisi",
      }, { status: 400 });
    }

    const result = await createTicket(user.id, {
      subject,
      message,
      category,
      priority,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ticket: result.ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}