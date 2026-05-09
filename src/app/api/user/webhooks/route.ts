import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { getWebhooks, createWebhook, WEBHOOK_EVENTS, type WebhookEvent } from "@/lib/services/webhookService";

export async function GET() {
  try {
    const user = await requireUser();

    const result = await getWebhooks(user.id);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, webhooks: result.webhooks });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (error.message.includes("BUSINESS")) {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const { url, events, secret } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, message: "URL wajib diisi" },
        { status: 400 }
      );
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { success: false, message: "Minimal satu event harus dipilih" },
        { status: 400 }
      );
    }

    // Validate events
    const validEvents = Object.values(WEBHOOK_EVENTS);
    const invalidEvents = events.filter((e: string) => !validEvents.includes(e as WebhookEvent));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { success: false, message: `Event tidak valid: ${invalidEvents.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await createWebhook(user.id, {
      url,
      events: events as WebhookEvent[],
      secret,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, webhook: result.webhook });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (error.message.includes("BUSINESS")) {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}