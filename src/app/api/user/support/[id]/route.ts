import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromCookie } from "@/lib/auth";
import { getTicketById, updateTicketStatus, addTicketResponse } from "@/lib/services/supportService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const user = await getUserFromCookie(cookieStore);

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await getTicketById(id);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    // Check ownership
    if (result.ticket?.userId !== user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      ticket: result.ticket,
    });
  } catch (error) {
    console.error("Get ticket error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const user = await getUserFromCookie(cookieStore);

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const existing = await getTicketById(id);
    if (!existing.success || !existing.ticket) {
      return NextResponse.json({ success: false, message: "Tiket tidak ditemukan" }, { status: 404 });
    }

    if (existing.ticket.userId !== user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { status, responseMessage } = body;

    // Handle response message
    if (responseMessage) {
      const result = await addTicketResponse(id, user.id, responseMessage);
      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        ticket: result.ticket,
      });
    }

    // Handle status update
    if (status) {
      const result = await updateTicketStatus(id, user.id, status);
      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        ticket: result.ticket,
      });
    }

    return NextResponse.json({ success: false, message: "No updates provided" }, { status: 400 });
  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}