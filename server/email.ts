// ClickSend email utility
// Docs: https://developers.clicksend.com/docs/rest/v3/#send-email

const CLICKSEND_API = "https://rest.clicksend.com/v3/email/send";

function getAuth(): string | null {
  const username = process.env.CLICKSEND_USERNAME;
  const apiKey = process.env.CLICKSEND_API_KEY;
  if (!username || !apiKey) return null;
  return Buffer.from(`${username}:${apiKey}`).toString("base64");
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailOptions {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const auth = getAuth();
  const fromEmail = process.env.CLICKSEND_FROM_EMAIL ?? process.env.CLICKSEND_USERNAME ?? "noreply@example.com";
  const fromName = process.env.CLICKSEND_FROM_NAME ?? "CourseMini";

  const recipients = Array.isArray(opts.to) ? opts.to : [opts.to];

  if (!auth) {
    throw new Error("Email not configured: set CLICKSEND_USERNAME and CLICKSEND_API_KEY environment variables.");
  }

  const emailAddressId = process.env.CLICKSEND_FROM_EMAIL_ID
    ? parseInt(process.env.CLICKSEND_FROM_EMAIL_ID)
    : undefined;

  const body: Record<string, any> = {
    to: recipients.map((r) => ({ email: r.email, name: r.name ?? r.email })),
    from: emailAddressId
      ? { email_address_id: emailAddressId, name: fromName }
      : { email: fromEmail, name: fromName },
    subject: opts.subject,
    body: opts.html,
  };

  const res = await fetch(CLICKSEND_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClickSend error ${res.status}: ${text}`);
  }
}

// ─── Password reset ────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await sendEmail({
    to: { email: to },
    subject: "Reset your CourseMini password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#333">Reset your password</h2>
        <p>We received a request to reset the password for your CourseMini account.</p>
        <p>Click the button below to choose a new password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#f97316;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#666;font-size:13px">Or copy and paste this link:<br>${resetUrl}</p>
      </div>
    `,
  });
}

// ─── Bulk campaign send ────────────────────────────────────────────────────────
// Sends to up to 50 recipients per batch (ClickSend limit per call)

export async function sendBulkEmail(
  recipients: EmailRecipient[],
  subject: string,
  html: string,
): Promise<{ sent: number; failed: number }> {
  const BATCH = 50;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    try {
      await sendEmail({ to: batch, subject, html });
      sent += batch.length;
    } catch (e) {
      console.error("[email] Bulk batch failed:", e);
      failed += batch.length;
    }
  }

  return { sent, failed };
}
