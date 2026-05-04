import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (eventName: string, data: any) => {
        const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // Send initial state immediately
      const sendInitialState = async () => {
        try {
          if (sessionId) {
            // Single session mode
            const session = await prisma.examSession.findUnique({
              where: { id: sessionId },
              include: {
                student: { select: { buyerName: true, buyerEmail: true } },
                activityLogs: {
                  orderBy: { createdAt: "desc" },
                  take: 20,
                },
              },
            });

            if (session) {
              sendEvent("session_update", session);
            }
          } else {
            // All active sessions
            const sessions = await prisma.examSession.findMany({
              where: { status: "IN_PROGRESS" },
              include: {
                student: { select: { buyerName: true, buyerEmail: true } },
                _count: {
                  select: {
                    activityLogs: {
                      where: {
                        activityType: { in: ["TAB_SWITCH", "FULLSCREEN_EXIT"] },
                      },
                    },
                  },
                },
              },
            });

            sendEvent("sessions_list", sessions);
          }

          // Active session count
          const activeCount = await prisma.examSession.count({
            where: { status: "IN_PROGRESS" },
          });
          sendEvent("active_count", { count: activeCount });

          // Warning count
          const warningCount = await prisma.examActivityLog.count({
            where: { activityType: { in: ["TAB_SWITCH", "FULLSCREEN_EXIT"] } },
          });
          sendEvent("warning_count", { count: warningCount });
        } catch (err) {
          console.error("SSE Initial Error:", err);
        }
      };

      // Initial state
      await sendInitialState();

      // Heartbeat to keep connection alive
      let heartbeatCount = 0;
      const heartbeatInterval = setInterval(() => {
        try {
          heartbeatCount++;
          sendEvent("heartbeat", { timestamp: Date.now(), count: heartbeatCount });
        } catch {
          clearInterval(heartbeatInterval);
          clearInterval(pollInterval);
        }
      }, 30000); // Every 30 seconds

      // Poll for updates every 5 seconds
      const pollInterval = setInterval(async () => {
        try {
          await sendInitialState();
        } catch (err) {
          console.error("SSE Poll Error:", err);
        }
      }, 5000);

      // Cleanup on close
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        clearInterval(pollInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
