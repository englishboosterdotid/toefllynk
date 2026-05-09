import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import {
  updateWebhook,
  deleteWebhook,
  WEBHOOK_EVENTS,
  type WebhookEvent,
} from "@/lib/services/webhookService";
import { webhookRepository } from "@/lib/repositories";

export async function GET(req: Request) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(req.url);
    const webhookId = searchParams.get("id");

    if (!webhookId) {
      return NextResponse.json(
        { success: false, message: "Webhook ID required" },
        { status: 400 }
      );
    }

    const webhook = await webhookRepository.findById(webhookId);

    if (!webhook || webhook.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Webhook not found" },
        { status: 404 }
      );
    }

    const deliveries = await webhookRepository.findAllDeliveries(webhookId);

    return NextResponse.json({
      success: true,
      webhook,
      deliveries: deliveries.data,
    });
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

    const { id, url, events, secret, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Webhook ID required" },
        { status: 400 }
      );
    }

    // Validate events if provided
    if (events) {
      if (!Array.isArray(events) || events.length === 0) {
        return NextResponse.json(
          { success: false, message: "Minimal satu event harus dipilih" },
          { status: 400 }
        );
      }

      const validEvents = Object.values(WEBHOOK_EVENTS);
      const invalidEvents = events.filter((e: string) => !validEvents.includes(e as WebhookEvent));
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { success: false, message: `Event tidak valid: ${invalidEvents.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Validate URL if provided
    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { success: false, message: "URL tidak valid" },
          { status: 400 }
        );
      }
    }

    const result = await updateWebhook(id, user.id, {
      url,
      events: events as WebhookEvent[] | undefined,
      secret,
      isActive,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, webhook: result.webhook });
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
    const webhookId = searchParams.get("id");

    if (!webhookId) {
      return NextResponse.json(
        { success: false, message: "Webhook ID required" },
        { status: 400 }
      );
    }

    const result = await deleteWebhook(webhookId, user.id);

    if (!result.success) {
      const status = result.error === "Unauthorized" ? 403 : 400;
      return NextResponse.json({ success: false, message: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}