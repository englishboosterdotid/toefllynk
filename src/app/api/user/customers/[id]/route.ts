import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import {
  createCustomer,
  updateCustomer,
  getCustomerById,
  deleteCustomer,
} from "@/lib/services/customerService";

export async function GET(req: Request) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("id");

    if (!customerId) {
      return NextResponse.json({ success: false, message: "Customer ID required" }, { status: 400 });
    }

    const customer = await getCustomerById(customerId, user.id);

    if (!customer) {
      return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const { buyerName, buyerEmail, buyerPhone, buyerAddress, tags } = body;

    if (!buyerName || !buyerEmail) {
      return NextResponse.json(
        { success: false, message: "Nama dan email wajib diisi" },
        { status: 400 }
      );
    }

    const result = await createCustomer(user.id, {
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
      tags,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, customer: result.customer });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const { id, buyerName, buyerEmail, buyerPhone, buyerAddress, notes, tags } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Customer ID required" }, { status: 400 });
    }

    const result = await updateCustomer(id, user.id, {
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
      notes,
      tags,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, customer: result.customer });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("id");

    if (!customerId) {
      return NextResponse.json({ success: false, message: "Customer ID required" }, { status: 400 });
    }

    const result = await deleteCustomer(customerId, user.id);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}