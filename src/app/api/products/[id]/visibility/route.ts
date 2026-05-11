import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { ProductService } from "@/lib/services/ProductService";

type Params = Promise<{ id: string }>;

export async function PATCH(
  req: Request,
  { params }: { params: Params }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const { visible } = body;

    const result = await ProductService.toggleMicrositeVisibility(id, user.id, visible === true);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    console.error("Toggle visibility error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
