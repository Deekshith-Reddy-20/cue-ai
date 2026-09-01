/**
 * Email delivery abstraction.
 * No third-party SDK required. Wire SMTP later via env without changing call sites.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  headers?: Record<string, string>;
};

export type EmailSendResult =
  | { ok: true; provider: string; messageId?: string; deferred?: boolean }
  | { ok: false; provider: string; error: string };

export type EmailProvider = {
  name: string;
  isConfigured: () => boolean;
  send: (message: EmailMessage) => Promise<EmailSendResult>;
};

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/** Logs only — used when SMTP is not configured. Never throws. */
const logProvider: EmailProvider = {
  name: "log",
  isConfigured: () => true,
  async send(message) {
    console.info("[email:log]", {
      to: message.to,
      subject: message.subject,
      textPreview: message.text.slice(0, 120),
    });
    return { ok: true, provider: "log", deferred: true, messageId: `log_${Date.now()}` };
  },
};

/**
 * SMTP-ready provider. Activates only when SMTP_HOST + SMTP_FROM are set.
 * Uses Node net/tls-free fetch-less stub: records intent; real nodemailer can replace send().
 * We intentionally avoid adding nodemailer until SMTP is configured in production.
 */
const smtpProvider: EmailProvider = {
  name: "smtp",
  isConfigured: () =>
    Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM) &&
    process.env.SMTP_ENABLED === "true",
  async send(message) {
    // Placeholder transport: do not open sockets without an explicit SMTP client dependency.
    // When ready, replace this body with nodemailer / platform SMTP binding.
    console.info("[email:smtp-ready]", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || "587",
      from: process.env.SMTP_FROM,
      to: message.to,
      subject: message.subject,
      note: "SMTP_ENABLED is true but no SMTP client library is installed yet. Message queued to log only.",
    });
    return {
      ok: true,
      provider: "smtp-pending",
      deferred: true,
      messageId: `smtp_pending_${Date.now()}`,
    };
  },
};

export function getEmailProvider(): EmailProvider {
  if (smtpProvider.isConfigured()) return smtpProvider;
  return logProvider;
}

export function isEmailDeliveryConfigured() {
  return smtpProvider.isConfigured();
}

export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  const provider = getEmailProvider();
  try {
    return await provider.send(message);
  } catch (e) {
    return {
      ok: false,
      provider: provider.name,
      error: e instanceof Error ? e.message : "Email send failed",
    };
  }
}

export function buildInviteEmail(opts: {
  to: string;
  workspaceName: string;
  role: string;
  inviteToken: string;
  expiresAt: string;
}) {
  const acceptUrl = `${appBaseUrl()}/invite/${opts.inviteToken}`;
  const subject = `You're invited to ${opts.workspaceName} on CueAI`;
  const text = [
    `You've been invited to join "${opts.workspaceName}" as ${opts.role}.`,
    ``,
    `Accept your invitation: ${acceptUrl}`,
    ``,
    `This link expires at ${opts.expiresAt} and can only be used once.`,
    `If you did not expect this email, you can ignore it.`,
  ].join("\n");
  const html = `
    <p>You've been invited to join <strong>${escapeHtml(opts.workspaceName)}</strong> as <strong>${escapeHtml(opts.role)}</strong>.</p>
    <p><a href="${acceptUrl}">Accept your invitation</a></p>
    <p style="color:#666;font-size:12px">This link expires at ${escapeHtml(opts.expiresAt)} and can only be used once.</p>
  `.trim();
  return { to: opts.to, subject, text, html, acceptUrl };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
