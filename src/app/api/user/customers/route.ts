import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { getCustomersByOwner } from "@/lib/services/customerService";

export async function GET(req: Request) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || undefined;

    const result = await getCustomersByOwner(user.id, page, limit, search);

    if (!result.canAddMore && !search) {
      return NextResponse.json({
        success: false,
        message: result.limitMessage,
        customers: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        limitReached: true,
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      customers: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}