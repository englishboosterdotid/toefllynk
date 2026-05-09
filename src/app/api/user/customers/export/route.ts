import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { exportCustomers } from "@/lib/services/customerService";

export async function GET(req: Request) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "csv") as "csv" | "json";

    if (!["csv", "json"].includes(format)) {
      return NextResponse.json(
        { success: false, message: "Format harus csv atau json" },
        { status: 400 }
      );
    }

    const result = await exportCustomers(user.id, format);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 403 });
    }

    const contentType = format === "json" ? "application/json" : "text/csv";
    const filename = `customers_${new Date().toISOString().split("T")[0]}.${format}`;

    return new Response(result.data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}