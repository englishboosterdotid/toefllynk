import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuditLogs, logAudit } from "@/lib/auditLog";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const params = {
      adminId: searchParams.get("adminId") || undefined,
      entityType: searchParams.get("entityType") || undefined,
      action: searchParams.get("action") as any || undefined,
      startDate: searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined,
      endDate: searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : undefined,
      take: parseInt(searchParams.get("take") || "50"),
      skip: parseInt(searchParams.get("skip") || "0"),
    };

    const result = await getAuditLogs(params);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Audit log fetch error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}

// Manual log entry (for custom logging)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adminId, action, entityType, entityId, oldValue, newValue, details } = body;

    if (!adminId || !action || !entityType) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get IP and user agent from request headers
    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0] : "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    await logAudit({
      adminId,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
      details,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json({ success: false, message: error.message }, { status: error.message === "Unauthorized" ? 401 : 403 });
    }
    console.error("Audit log create error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}
