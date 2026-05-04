/**
 * Simple Email Template Renderer
 * Supports basic template syntax: {{variable}} and basic conditionals
 */

interface TemplateData {
  [key: string]: any;
}

// Template registry
const templates: Record<string, string> = {
  "order-confirmation": `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 12px; line-height: 60px; font-size: 24px; color: white; font-weight: bold;">
        TL
      </div>
      <h1 style="color: #1e293b; margin: 16px 0 8px;">Order Confirmation</h1>
      <p style="color: #64748b; margin: 0;">Terima kasih atas pembelian Anda!</p>
    </div>

    <div style="background: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <h2 style="color: #334155; margin: 0 0 16px; font-size: 16px;">Detail Pesanan</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #64748b; padding: 8px 0;">Order ID</td>
          <td style="color: #1e293b; text-align: right; font-weight: 500; font-family: monospace;">{{orderId}}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0;">Produk</td>
          <td style="color: #1e293b; text-align: right; font-weight: 500;">{{productName}}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0;">Nama</td>
          <td style="color: #1e293b; text-align: right; font-weight: 500;">{{buyerName}}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0;">Exam Credits</td>
          <td style="color: #1e293b; text-align: right; font-weight: 500;">{{examCredits}} kali kesempatan</td>
        </tr>
        <tr style="border-top: 1px solid #e2e8f0;">
          <td style="color: #334155; padding: 12px 0 0; font-weight: 600;">Total</td>
          <td style="color: #3b82f6; text-align: right; font-weight: 700; font-size: 20px;">Rp {{amount}}</td>
        </tr>
      </table>
    </div>

    <div style="background: linear-gradient(135deg, #10b981, #059669); border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="color: white; margin: 0 0 8px; font-size: 14px;">🎉 Akses Student Anda</p>
      <p style="color: white; margin: 0; font-size: 12px; opacity: 0.8;">Login URL:</p>
      <p style="color: white; margin: 4px 0; font-weight: 600;">
        <a href="{{loginUrl}}" style="color: white; text-decoration: underline;">{{loginUrl}}</a>
      </p>
    </div>

    <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="color: #92400e; margin: 0 0 12px; font-size: 14px; font-weight: 600;">🔑 Access Token Anda</p>
      <div style="background: white; border-radius: 6px; padding: 16px; text-align: center;">
        <code style="color: #1e293b; font-size: 16px; font-family: monospace; word-break: break-all;">{{accessToken}}</code>
      </div>
      <p style="color: #b45309; margin: 12px 0 0; font-size: 12px;">
        ⚠️ Simpan access token ini dengan aman. Token digunakan bersama email untuk login.
      </p>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="{{dashboardUrl}}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
        Buka Dashboard Student
      </a>
    </div>

    <div style="text-align: center; color: #94a3b8; font-size: 12px;">
      <p>© 2024 TOEFL Lynk. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,

  "exam-result": `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exam Result</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px; line-height: 60px; font-size: 24px; color: white; font-weight: bold;">
        ✓
      </div>
      <h1 style="color: #1e293b; margin: 16px 0 8px;">Exam Completed!</h1>
      <p style="color: #64748b; margin: 0;">Hasil ujian TOEFL Anda sudah siap</p>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
      <div style="background: linear-gradient(135deg, #1e293b, #0f172a); color: white; border-radius: 16px; padding: 32px; display: inline-block; min-width: 200px;">
        <p style="color: #94a3b8; margin: 0 0 8px; font-size: 14px;">YOUR SCORE</p>
        <p style="font-size: 64px; font-weight: 800; margin: 0; line-height: 1;">{{score}}</p>
      </div>
    </div>

    <div style="background: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <h2 style="color: #334155; margin: 0 0 16px; font-size: 16px;">Section Breakdown</h2>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
        <div style="text-align: center; padding: 16px; background: #f0f9ff; border-radius: 8px;">
          <p style="color: #0284c7; font-size: 24px; font-weight: 700; margin: 0;">{{listening}}</p>
          <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Listening</p>
        </div>
        <div style="text-align: center; padding: 16px; background: #faf5ff; border-radius: 8px;">
          <p style="color: #7c3aed; font-size: 24px; font-weight: 700; margin: 0;">{{structure}}</p>
          <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Structure</p>
        </div>
        <div style="text-align: center; padding: 16px; background: #f0fdf4; border-radius: 8px;">
          <p style="color: #16a34a; font-size: 24px; font-weight: 700; margin: 0;">{{reading}}</p>
          <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Reading</p>
        </div>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="{{resultUrl}}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Full Result
      </a>
    </div>

    <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 32px;">
      <p>© 2024 TOEFL Lynk. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,

  "certificate-ready": `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate Ready</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fef3c7, #fde68a);">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; line-height: 60px; font-size: 28px;">
        🏆
      </div>
      <h1 style="color: #1e293b; margin: 16px 0 8px;">Congratulations!</h1>
      <p style="color: #64748b; margin: 0;">Sertifikat TOEFL Anda sudah tersedia</p>
    </div>

    <div style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 2px solid #fbbf24; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <p style="color: #92400e; font-size: 14px; margin: 0 0 8px;">Score Achieved</p>
      <p style="color: #b45309; font-size: 48px; font-weight: 800; margin: 0;">{{score}}</p>
    </div>

    <p style="color: #475569; text-align: center; margin-bottom: 24px;">
      Selamat <strong>{{studentName}}</strong>! Anda telah menyelesaikan ujian TOEFL dengan skor yang luar biasa.
    </p>

    <div style="text-align: center;">
      <a href="{{certificateUrl}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Download Certificate
      </a>
    </div>

    <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 32px;">
      <p>© 2024 TOEFL Lynk. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,

  "password-reset": `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 12px; line-height: 60px; font-size: 24px; color: white;">
        🔑
      </div>
      <h1 style="color: #1e293b; margin: 16px 0 8px;">Reset Password</h1>
      <p style="color: #64748b; margin: 0;">Kami menerima permintaan reset password untuk akun Anda</p>
    </div>

    <p style="color: #334155; margin-bottom: 24px;">
      Hai <strong>{{name}}</strong>, klik tombol di bawah untuk reset password Anda.
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="{{resetUrl}}" style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Reset Password
      </a>
    </div>

    <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="color: #dc2626; font-size: 14px; margin: 0;">
        ⚠️ Link ini akan expire dalam <strong>{{expiresIn}}</strong>. Jika Anda tidak merasa meminta reset password, abaikan email ini.
      </p>
    </div>

    <div style="text-align: center; color: #94a3b8; font-size: 12px;">
      <p>© 2024 TOEFL Lynk. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
};

// Simple template renderer
export async function render(templateName: string, data: TemplateData): Promise<string> {
  const template = templates[templateName];

  if (!template) {
    throw new Error(`Template "${templateName}" not found`);
  }

  let html = template;

  // Replace {{variable}} with data
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    const displayValue = typeof value === "number" ? value.toLocaleString("id-ID") : String(value || "");
    html = html.replace(regex, displayValue);
  }

  // Remove any remaining {{variables}} (replace with empty)
  html = html.replace(/\{\{[^}]+\}\}/g, "");

  return html;
}

// Get available templates
export function getTemplates(): string[] {
  return Object.keys(templates);
}

// Check if template exists
export function hasTemplate(name: string): boolean {
  return name in templates;
}