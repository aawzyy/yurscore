/**
 * Transactional Email Service for YurScore
 * Supports:
 * 1. Resend API (if RESEND_API_KEY is configured)
 * 2. Standard SMTP / Gmail SMTP (if SMTP_USER and SMTP_PASS are configured)
 * 3. Graceful fallback (logs link and info to console)
 */

import nodemailer from "nodemailer";

export interface SendClubInviteParams {
  toEmail: string;
  clubName: string;
  clubCode: string;
  inviterName: string;
  inviteLink: string;
}

export async function sendClubInviteEmail(params: SendClubInviteParams) {
  const { toEmail, clubName, clubCode, inviterName, inviteLink } = params;

  console.log(`\n======================================================`);
  console.log(`[EMAIL DISPATCH] To: ${toEmail}`);
  console.log(`[EMAIL DISPATCH] Subject: Undangan Bergabung ke Club "${clubName}" di YurScore`);
  console.log(`[EMAIL DISPATCH] Pengundang: ${inviterName}`);
  console.log(`[EMAIL DISPATCH] Kode Club: ${clubCode}`);
  console.log(`[EMAIL DISPATCH] Tautan Gabung: ${inviteLink}`);
  console.log(`======================================================\n`);

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px;">
      <div style="margin-bottom: 20px; display: inline-block; background-color: #f1f9ea; color: #32580E; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; border: 1px solid rgba(116, 183, 46, 0.3);">
        🏆 YurScore Club Invitation
      </div>
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 12px 0;">
        Undangan Bergabung ke Club
      </h1>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
        Halo! <strong>${inviterName}</strong> mengundang Anda untuk bergabung ke komunitas olahraga <strong>${clubName}</strong> di platform YurScore.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
          Kode Akses Club
        </div>
        <div style="font-size: 24px; font-weight: 900; color: #74B72E; letter-spacing: 3px; font-family: monospace;">
          ${clubCode}
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${inviteLink}" style="background-color: #74B72E; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 14px; font-weight: 700; border-radius: 12px; display: inline-block;">
          Terima Undangan & Daftar / Masuk
        </a>
      </div>

      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
        Tautan registrasi langsung:<br/>
        <a href="${inviteLink}" style="color: #74B72E; word-break: break-all;">${inviteLink}</a>
      </p>
    </div>
  `;

  // 1. Try Resend API if RESEND_API_KEY is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const fromAddress = process.env.EMAIL_FROM || "YurScore <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [toEmail],
          subject: `Undangan Bergabung ke Club ${clubName} - YurScore`,
          html: htmlContent,
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        console.log("[Resend Success] Email sent with ID:", resData.id);
        return { success: true, provider: "resend", id: resData.id };
      } else {
        console.warn("[Resend Warning]", resData);
      }
    } catch (err: any) {
      console.error("[Resend Exception]", err);
    }
  }

  // 2. Try SMTP (e.g. Gmail SMTP) if SMTP_USER and SMTP_PASS are configured
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 465,
        secure: (process.env.SMTP_PORT || "465") === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"YurScore" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `Undangan Bergabung ke Club ${clubName} - YurScore`,
        html: htmlContent,
      });

      console.log("[SMTP Success] Email dispatched to inbox:", info.messageId);
      return { success: true, provider: "smtp", id: info.messageId };
    } catch (err: any) {
      console.error("[SMTP Exception]", err);
    }
  }

  // 3. Fallback: Simulated
  return {
    success: true,
    provider: "simulated",
    to: toEmail,
    clubName,
    inviteLink,
    message: "Email undangan berhasil diproses (simulasi server).",
  };
}
