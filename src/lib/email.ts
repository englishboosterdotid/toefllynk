/**
 * Email Provider Abstraction
 * Supports: nodemailer, resend
 *
 * Usage:
 *   import { sendEmail, EmailTemplate } from "@/lib/email"
 *
 *   await sendEmail({
 *     to: "user@example.com",
 *     subject: "Welcome",
 *     template: "welcome",
 *     data: { name: "John" }
 *   })
 */

import { render } from "./email/templates";

// ============================================
// CONFIGURATION
// ============================================

export type EmailProvider = "nodemailer" | "resend";

interface EmailConfig {
  provider: EmailProvider;
  // Nodemailer
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  // Resend
  resendApiKey?: string;
  resendFrom?: string;
}

function getConfig(): EmailConfig {
  return {
    provider: (process.env.EMAIL_PROVIDER as EmailProvider) || "nodemailer",
    // Nodemailer
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || "587"),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpFrom: process.env.SMTP_FROM || "TOEFL Lynk <noreply@toefllynk.com>",
    // Resend
    resendApiKey: process.env.RESEND_API_KEY,
    resendFrom: process.env.RESEND_FROM || "TOEFL Lynk <noreply@toefllynk.com>",
  };
}

// ============================================
// TYPES
// ============================================

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  data?: Record<string, any>;
  attachments?: { filename: string; content: Buffer | string }[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// NODEMAILER PROVIDER
// ============================================

async function sendNodemailer(options: EmailOptions): Promise<EmailResult> {
  const config = getConfig();

  const nodemailer = await import("nodemailer");

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort || 587,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });

  let htmlContent = options.html || "";
  if (options.template && options.data) {
    htmlContent = await render(options.template, options.data);
  }

  const mailOptions = {
    from: config.smtpFrom,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    html: htmlContent,
    text: options.text,
    attachments: options.attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Nodemailer: Email sent", info.messageId);

  return { success: true, messageId: info.messageId };
}

// ============================================
// RESEND PROVIDER
// ============================================

async function sendResend(options: EmailOptions): Promise<EmailResult> {
  const config = getConfig();

  const { Resend } = await import("resend");
  const resend = new Resend(config.resendApiKey);

  let htmlContent = options.html || "";
  if (options.template && options.data) {
    htmlContent = await render(options.template, options.data);
  }

  const { data, error } = await resend.emails.send({
    from: config.resendFrom,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: htmlContent || "<p></p>",
  } as any);

  if (error) {
    console.error("Resend error:", error);
    return { success: false, error: error.message };
  }

  console.log("Resend: Email sent", data?.id);
  return { success: true, messageId: data?.id };
}

// ============================================
// MAIN EXPORT
// ============================================

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const config = getConfig();

  try {
    switch (config.provider) {
      case "resend":
        return await sendResend(options);
      case "nodemailer":
      default:
        return await sendNodemailer(options);
    }
  } catch (error: any) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export async function sendOrderConfirmation(email: string, order: {
  orderId: string;
  productName: string;
  amount: number;
  buyerName: string;
  accessToken?: string;
  examCredits?: number;
  dashboardUrl?: string;
  loginUrl?: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return sendEmail({
    to: email,
    subject: `Order Confirmation - ${order.productName}`,
    template: "order-confirmation",
    data: {
      ...order,
      accessToken: order.accessToken || "",
      examCredits: order.examCredits || 1,
      dashboardUrl: order.dashboardUrl || `${appUrl}/student/dashboard`,
      loginUrl: order.loginUrl || `${appUrl}/student/login`,
    },
  });
}

export async function sendExamResult(email: string, result: {
  studentName: string;
  score: number;
  listening: number;
  structure: number;
  reading: number;
  resultUrl: string;
}) {
  return sendEmail({
    to: email,
    subject: `TOEFL Exam Result - Score ${result.score}`,
    template: "exam-result",
    data: result,
  });
}

export async function sendCertificateReady(email: string, data: {
  studentName: string;
  score: number;
  certificateUrl: string;
}) {
  return sendEmail({
    to: email,
    subject: `Your TOEFL Certificate is Ready!`,
    template: "certificate-ready",
    data,
  });
}

export async function sendPasswordReset(email: string, data: {
  name: string;
  resetUrl: string;
  expiresIn: string;
}) {
  return sendEmail({
    to: email,
    subject: "Reset Your Password - TOEFL Lynk",
    template: "password-reset",
    data,
  });
}

export function getProvider(): EmailProvider {
  return getConfig().provider;
}