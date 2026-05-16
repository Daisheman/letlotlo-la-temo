import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

type EmailTemplate = {
  to: string;
  subject: string;
  html: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function codeBoxes(code: string) {
  return code
    .split("")
    .map(
      (digit) =>
        `<span style="display:inline-block;width:42px;height:52px;line-height:52px;margin:0 3px;text-align:center;border:2px solid #D4A017;border-radius:10px;color:#1B5E35;font-size:28px;font-weight:800;background:#FFFDF6;">${digit}</span>`
    )
    .join("");
}

function layout(title: string, tagline: string, body: string) {
  return `<!doctype html>
  <html>
    <body style="margin:0;padding:0;background:#f4faf5;font-family:Arial,Helvetica,sans-serif;color:#183528;">
      <div style="max-width:480px;margin:0 auto;padding:24px 12px;">
        <div style="background:#1B5E35;border-radius:16px 16px 0 0;padding:24px;text-align:center;color:white;">
          <div style="font-size:24px;font-weight:800;letter-spacing:.2px;">Letlotlo la Temo</div>
          <div style="font-size:13px;margin-top:6px;color:#E5F3E6;">AI Farming Assistant</div>
        </div>
        <div style="background:#ffffff;padding:28px 24px;border-left:1px solid #e5f3e6;border-right:1px solid #e5f3e6;">
          <h1 style="font-size:22px;line-height:1.25;color:#1B5E35;margin:0 0 18px;">${title}</h1>
          <p style="font-size:15px;line-height:1.55;margin:0 0 18px;color:#385443;">${tagline}</p>
          ${body}
        </div>
        <div style="background:#1B5E35;border-radius:0 0 16px 16px;padding:18px;text-align:center;color:#E5F3E6;font-size:12px;line-height:1.5;">
          <div>&copy; ${new Date().getFullYear()} Letlotlo la Temo</div>
          <div>DVS Botswana emergency animal disease reporting: +267 3950500</div>
        </div>
      </div>
    </body>
  </html>`;
}

function otpBody(name: string, code: string, copy: string, expires: string, after: string, extra = "") {
  return `
    <p style="font-size:16px;line-height:1.55;margin:0 0 18px;">Dumela ${escapeHtml(name)}, ${copy}</p>
    <div style="text-align:center;margin:24px 0 20px;white-space:nowrap;">${codeBoxes(code)}</div>
    <p style="font-size:14px;line-height:1.55;margin:0 0 10px;color:#6B3F1D;">This code expires in ${expires}.</p>
    ${extra}
    <p style="font-size:13px;line-height:1.55;margin:18px 0 0;color:#667568;">${after}</p>`;
}

export function verificationEmail(to: string, name: string, code: string): EmailTemplate {
  return {
    to,
    subject: `Your Letlotlo la Temo verification code: ${code}`,
    html: layout(
      "Verify your email",
      "Confirm your address so Temo can protect your farming account.",
      otpBody(name, code, "here is your verification code:", "15 minutes", "If you did not create an account, ignore this email.")
    )
  };
}

export function passwordResetEmail(to: string, name: string, code: string): EmailTemplate {
  return {
    to,
    subject: "Reset your Letlotlo la Temo password",
    html: layout(
      "Reset your password",
      "We received a request to reset your password.",
      otpBody(name, code, "use this code to reset your password:", "15 minutes", "If you did not request this, your account is safe. Ignore this email.")
    )
  };
}

export function mfaLoginEmail(to: string, name: string, code: string, ipAddress?: string): EmailTemplate {
  return {
    to,
    subject: `Your Letlotlo la Temo login code: ${code}`,
    html: layout(
      "Login code",
      "A login attempt was made to your account.",
      otpBody(
        name,
        code,
        "use this code to finish signing in:",
        "10 minutes",
        "If this was not you, change your password immediately.",
        `<p style="font-size:13px;color:#667568;margin:0;">From: ${escapeHtml(ipAddress ?? "unknown IP")}, approximate location unavailable</p>`
      )
    )
  };
}

export function mfaEnabledEmail(to: string, name: string): EmailTemplate {
  return {
    to,
    subject: "Two-factor authentication enabled on your account",
    html: layout(
      "Two-factor authentication is active",
      `Dumela ${escapeHtml(name)}, MFA now protects your Letlotlo la Temo account.`,
      `<p style="font-size:15px;line-height:1.55;">Save your backup codes somewhere safe. You can use each code once if you lose your authenticator app.</p><p style="font-size:13px;color:#667568;">If you did not enable this, contact support immediately.</p>`
    )
  };
}

export function passwordChangedEmail(to: string, name: string): EmailTemplate {
  return {
    to,
    subject: "Your Letlotlo la Temo password was changed",
    html: layout(
      "Password changed",
      `Dumela ${escapeHtml(name)}, your password was successfully changed.`,
      `<p style="font-size:15px;line-height:1.55;">If you did not do this, secure your account immediately by resetting your password and contacting support.</p>`
    )
  };
}

export function welcomeEmail(to: string, name: string): EmailTemplate {
  return {
    to,
    subject: "Welcome to Letlotlo la Temo - let's grow something great",
    html: layout(
      "Welcome to Letlotlo la Temo",
      `Dumela ${escapeHtml(name)}. Re a go amogela - a re godiseng temo mmogo.`,
      `<ol style="font-size:15px;line-height:1.7;padding-left:20px;"><li>Add your farm and confirm its district.</li><li>Get AI advice for crops, water, soil, and livestock.</li><li>Invite a neighbor to share local farming knowledge.</li></ol><p style="font-size:15px;line-height:1.55;">Community forum: https://letlotlo.co.bw/community</p><p style="font-size:14px;color:#385443;">Emergency contacts: DVS +267 3950500, BAMB +267 3659500.</p>`
    )
  };
}

export async function sendEmail(template: EmailTemplate) {
  if (!resend) {
    console.log(`Email queued without RESEND_API_KEY: ${template.to} - ${template.subject}`);
    return { id: "local-email-log" };
  }

  const result = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: template.to,
    subject: template.subject,
    html: template.html
  });
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
