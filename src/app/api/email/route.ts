import { NextResponse } from "next/server";
import {
  sendEmail,
  sendOrderConfirmation,
  sendExamResult,
  sendCertificateReady,
  getProvider,
} from "@/lib/email";

export async function GET() {
  const provider = getProvider();
  return NextResponse.json({
    success: true,
    provider,
    message: `Email configured with ${provider}`,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ...data } = body;

    switch (action) {
      case "send-order-confirmation":
        if (!data.email || !data.order) {
          return NextResponse.json(
            { success: false, message: "Missing email or order data" },
            { status: 400 }
          );
        }
        const orderResult = await sendOrderConfirmation(data.email, data.order);
        return NextResponse.json(orderResult);

      case "send-exam-result":
        if (!data.email || !data.result) {
          return NextResponse.json(
            { success: false, message: "Missing email or result data" },
            { status: 400 }
          );
        }
        const resultResult = await sendExamResult(data.email, data.result);
        return NextResponse.json(resultResult);

      case "send-certificate":
        if (!data.email || !data.data) {
          return NextResponse.json(
            { success: false, message: "Missing email or data" },
            { status: 400 }
          );
        }
        const certResult = await sendCertificateReady(data.email, data.data);
        return NextResponse.json(certResult);

      case "test":
        const testResult = await sendEmail({
          to: data.email,
          subject: "Test Email - TOEFL Lynk",
          html: `
            <h1>Test Email</h1>
            <p>This is a test email from TOEFL Lynk.</p>
            <p>Provider: ${getProvider()}</p>
          `,
        });
        return NextResponse.json(testResult);

      default:
        // Generic email send
        const result = await sendEmail({
          to: body.to,
          subject: body.subject,
          html: body.html,
          text: body.text,
          template: body.template,
          data: body.data,
        });
        return NextResponse.json(result);
    }
  } catch (error: any) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}