/**
 * D.5 — Real email delivery via Resend (REST API, no extra dependency).
 *
 * Sends the branded templates defined in ./email-templates.ts (11 templates,
 * rendered with renderEmail). Replaces the VS-era console.log("[mock-email]")
 * stubs. When RESEND_API_KEY is set, mail goes out through Resend; in dev
 * (key absent) it falls back to a console log so local flows still work and
 * nothing is silently dropped.
 */

import { renderEmail, EMAIL_TEMPLATES, type EmailTemplateKey } from "./email-templates";

export type EmailTemplateName = EmailTemplateKey;

export interface SendEmailInput {
  to: string;
  template: EmailTemplateName;
  /** Variables for {{placeholder}} interpolation (e.g. { code, name, link }). */
  vars?: Record<string, string>;
}

export interface SendEmailResult {
  ok: boolean;
  dev?: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { to, template, vars = {} } = input;
  const def = EMAIL_TEMPLATES[template];
  if (!def) return { ok: false, error: `unknown_template:${template}` };

  const rendered = renderEmail(def, vars);
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || process.env.RESEND_FROM_EMAIL || "Voeq <noreply@voeq.ng>";

  // Dev fallback: no key configured.
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.log(`[email:dev] to=${to} subject="${rendered.subject}" template=${template}`);
    return { ok: true, dev: true };
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from,
        to: [to],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      }),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      return { ok: false, error: `resend_http_${r.status}: ${body.slice(0, 200)}` };
    }
    const json = (await r.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: json.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
