/**
 * Email Templates — Visual-only tier (K1.7)
 * 
 * HTML email templates for auth flows, notifications, and system alerts.
 * These are static templates with placeholder interpolation.
 * Actual sending is handled by backend email service.
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string; // Plain text fallback
}

export type EmailContext = Record<string, string | number>;

/**
 * Interpolate placeholders like {{name}} in template strings
 */
function interpolate(template: string, context: EmailContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(context[key] ?? `{{${key}}}`);
  });
}

/**
 * Render an email template with context
 */
export function renderEmail(
  template: EmailTemplate,
  context: EmailContext
): { subject: string; html: string; text: string } {
  return {
    subject: interpolate(template.subject, context),
    html: interpolate(template.html, context),
    text: interpolate(template.text, context),
  };
}

// ===== Base HTML wrapper =====
// P-A round 38: MODERN premium redesign (user: "emails look so bland").
// Warm cream canvas, forest header, amber CTA, serif wordmark, softer corners,
// real hierarchy. All templates share this base so every email updates at once.
const BASE_STYLE = `
  body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F6F1E6; }
  .email-container { max-width: 600px; margin: 24px auto; background: #FFFDF8; border-radius: 20px; overflow: hidden; border: 1px solid rgba(15,42,29,.08); box-shadow: 0 12px 40px rgba(15,42,29,.08); }
  .email-header { background: #0F2A1D; padding: 30px 24px 26px; text-align: center; }
  .email-logo { font-family: 'Playfair Display', Georgia, serif; font-size: 30px; font-weight: 700; color: #F6F1E6; margin: 0; letter-spacing: -.02em; }
  .email-logo span { color: #E8A33D; }
  .email-tagline { font-size: 12px; color: rgba(246,241,230,.7); margin: 6px 0 0; letter-spacing: .08em; text-transform: uppercase; font-family: 'Inter', sans-serif; }
  .email-body { padding: 32px 28px; color: #0F2A1D; }
  .email-body h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 600; margin: 0 0 14px; color: #0F2A1D; letter-spacing: -.01em; }
  .email-body p { font-size: 15.5px; line-height: 1.65; margin: 0 0 14px; color: #4A5C52; }
  .email-code-wrap { text-align: center; margin: 26px 0; }
  .email-code { display: inline-block; font-family: 'SF Mono', 'Courier New', monospace; font-size: 34px; font-weight: 700; letter-spacing: 10px; padding: 18px 30px; background: #F6F1E6; border: 1px solid rgba(232,163,61,.35); border-radius: 14px; color: #0F2A1D; tab-size: 8; user-select: all; }
  .email-copy { display: inline-block; margin-top: 10px; padding: 8px 18px; background: transparent; border: 1px solid #0F2A1D; color: #0F2A1D; border-radius: 999px; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
  .email-button { display: inline-block; padding: 14px 30px; background: #E8A33D; color: #0F2A1D !important; text-decoration: none; border-radius: 999px; font-weight: 650; margin: 14px 0; font-size: 15px; box-shadow: 0 6px 16px rgba(232,163,61,.35); }
  .email-list { line-height: 1.8; color: #4A5C52; font-size: 15px; padding-left: 20px; margin: 0 0 14px; }
  .email-note { font-size: 13px; color: #7A8C82; margin: 0 0 14px !important; }
  .email-footer { padding: 22px 24px; background: #F6F1E6; text-align: center; font-size: 13px; color: #7A8C82; border-top: 1px solid rgba(15,42,29,.06); }
  .email-footer a { color: #2D5A3D; text-decoration: none; font-weight: 500; }
  .email-footer .brand { font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #0F2A1D; font-weight: 600; }
`;

function wrapHtml(body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${BASE_STYLE}</style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1 class="email-logo">voeq<span>.</span></h1>
      <p class="email-tagline">The campus marketplace</p>
    </div>
    <div class="email-body">
      ${body}
    </div>
    <div class="email-footer">
      <span class="brand">Voeq</span> &mdash; The campus marketplace for Nigerian students
      <p style="margin:8px 0 0"><a href="https://voeq.ng">voeq.ng</a> &middot; <a href="https://voeq.ng/help">Help</a> &middot; <a href="https://voeq.ng/privacy">Privacy</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Copy-code helper (works in clients that allow inline script — most mobile
// mail apps; web clients fall back to the selectable code block).
const COPY_SCRIPT = `
<script>
  function copyCode(btn){
    var code = btn.getAttribute('data-code');
    if (navigator.clipboard) { navigator.clipboard.writeText(code); }
    var old = btn.textContent;
    btn.textContent = 'Copied ✓';
    setTimeout(function(){ btn.textContent = old; }, 1600);
  }
</script>
`;

function otpCodeBlock(code: string): string {
  return `
  <div class="email-code-wrap">
    <div class="email-code">${code}</div>
    <br>
    <button class="email-copy" data-code="${code}" onclick="copyCode(this)">Copy code</button>
  </div>`;
}

// ===== OTP Verification Email (Registration) =====
export const OTP_REGISTRATION: EmailTemplate = {
  subject: "Your Voeq verification code",
  html: wrapHtml(`
    ${COPY_SCRIPT}
    <h1>Verify your email</h1>
    <p>Welcome to Voeq! To complete your registration, enter this 6-digit code — or tap <strong>Copy code</strong>:</p>
    ${otpCodeBlock("{{code}}")}
    <p>This code expires in 10 minutes. If you didn't create a Voeq account, you can safely ignore this email.</p>
  `),
  text: `
Verify your email

Welcome to Voeq! To complete your registration, enter this 6-digit code:

{{code}}

This code expires in 10 minutes. If you didn't create a Voeq account, you can safely ignore this email.

---
Voeq — The campus marketplace for Nigerian students
https://voeq.ng
  `.trim(),
};

// ===== OTP Verification Email (Login) =====
export const OTP_LOGIN: EmailTemplate = {
  subject: "Your Voeq sign-in code",
  html: wrapHtml(`
    ${COPY_SCRIPT}
    <h1>Sign in to Voeq</h1>
    <p>Someone requested a sign-in code for your account. Enter this 6-digit code — or tap <strong>Copy code</strong>:</p>
    ${otpCodeBlock("{{code}}")}
    <p>This code expires in 10 minutes. If you didn't request this, someone may be trying to access your account. Consider changing your password.</p>
  `),
  text: `
Sign in to Voeq

Someone requested a sign-in code for your account. Enter this 6-digit code to continue:

{{code}}

This code expires in 10 minutes. If you didn't request this, someone may be trying to access your account. Consider changing your password.

---
Voeq — The campus marketplace for Nigerian students
https://voeq.ng
  `.trim(),
};

// ===== Password Reset Email =====
export const PASSWORD_RESET: EmailTemplate = {
  subject: "Reset your Voeq password",
  html: wrapHtml(`
    <h1>Reset your password</h1>
    <p>Someone requested a password reset for your Voeq account. Click the button below to choose a new password:</p>
    <div style="text-align: center;">
      <a href="{{resetLink}}" class="email-button">Reset password</a>
    </div>
    <p>This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
    <p style="font-size: 14px; color: #7A8C82;">If the button doesn't work, copy and paste this link into your browser:<br>{{resetLink}}</p>
  `),
  text: `
Reset your password

Someone requested a password reset for your Voeq account. Click the link below to choose a new password:

{{resetLink}}

This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.

---
Voeq — The campus marketplace for Nigerian students
https://voeq.ng
  `.trim(),
};

// ===== Welcome Email (Post-Verification) =====
export const WELCOME: EmailTemplate = {
  subject: "Welcome to Voeq, {{name}}!",
  html: wrapHtml(`
    <h1>Welcome to Voeq, {{name}}!</h1>
    <p>Your account is all set. You're now part of Nigeria's fastest-growing campus marketplace.</p>
    <p><strong>What's next?</strong></p>
    <ul style="line-height: 1.8; color: #4A5C52;">
      <li>Browse listings from students on your campus</li>
      <li>Message vendors directly in the app</li>
      <li>List your own items if you're ready to sell</li>
    </ul>
    <div style="text-align: center;">
      <a href="https://voeq.ng/explore" class="email-button">Start exploring</a>
    </div>
    <p>Need help? Check out our <a href="https://voeq.ng/help" style="color: #2D5A3D;">Help Center</a> or reply to this email.</p>
  `),
  text: `
Welcome to Voeq, {{name}}!

Your account is all set. You're now part of Nigeria's fastest-growing campus marketplace.

What's next?
- Browse listings from students on your campus
- Message vendors directly in the app
- List your own items if you're ready to sell

Start exploring: https://voeq.ng/explore

Need help? Check out our Help Center at https://voeq.ng/help or reply to this email.

---
Voeq — The campus marketplace for Nigerian students
https://voeq.ng
  `.trim(),
};

// ===== Account Suspended Email =====
export const ACCOUNT_SUSPENDED: EmailTemplate = {
  subject: "Your Voeq account has been suspended",
  html: wrapHtml(`
    <h1>Account suspended</h1>
    <p>Your Voeq account has been temporarily suspended while we review recent activity.</p>
    <p><strong>What this means:</strong></p>
    <ul style="line-height: 1.8; color: #4A5C52;">
      <li>You won't be able to sign in during the review</li>
      <li>Your listings are hidden from search</li>
      <li>We'll email you once the review is complete</li>
    </ul>
    <p>If you believe this is a mistake, contact our support team:</p>
    <div style="text-align: center;">
      <a href="mailto:support@voeq.ng?subject=Account%20suspension%20appeal" class="email-button">Contact support</a>
    </div>
  `),
  text: `
Account suspended

Your Voeq account has been temporarily suspended while we review recent activity.

What this means:
- You won't be able to sign in during the review
- Your listings are hidden from search
- We'll email you once the review is complete

If you believe this is a mistake, contact our support team at support@voeq.ng

---
Voeq — The campus marketplace for Nigerian students
https://voeq.ng
  `.trim(),
};

// ===== Account Banned Email =====
export const ACCOUNT_BANNED: EmailTemplate = {
  subject: "Your Voeq account has been banned",
  html: wrapHtml(`
    <h1>Account banned</h1>
    <p>Your Voeq account has been permanently banned for violating our Terms of Service.</p>
    <p>This decision is final. You will no longer be able to access Voeq with this account.</p>
    <p>If you have questions about this action, contact <a href="mailto:support@voeq.ng" style="color: #2D5A3D;">support@voeq.ng</a>.</p>
  `),
  text: `
Account banned

Your Voeq account has been permanently banned for violating our Terms of Service.

This decision is final. You will no longer be able to access Voeq with this account.

If you have questions about this action, contact support@voeq.ng

---
Voeq — The campus marketplace for Nigerian students
https://voeq.ng
  `.trim(),
};

// ===== Password Changed Alert =====
export const PASSWORD_CHANGED: EmailTemplate = {
  subject: "Your Voeq password was changed",
  html: wrapHtml(`
    <h1>Password changed</h1>
    <p>Your Voeq password was changed on {{date}} at {{time}} UTC.</p>
    <p>If you made this change, you're all set. If you didn't change your password, someone may have accessed your account.</p>
    <p><strong>What to do:</strong></p>
    <ul style="line-height: 1.8; color: #4A5C52;">
      <li>Reset your password immediately</li>
      <li>Review recent activity on your account</li>
      <li>Contact support if you see anything suspicious</li>
    </ul>
    <div style="text-align: center;">
      <a href="https://voeq.ng/forgot-password" class="email-button">Reset password</a>
    </div>
  `),
  text: `
Password changed

Your Voeq password was changed on {{date}} at {{time}} UTC.

If you made this change, you're all set. If you didn't change your password, someone may have accessed your account.

What to do:
- Reset your password immediately: https://voeq.ng/forgot-password
- Review recent activity on your account
- Contact support if you see anything suspicious

---
Voeq — The campus marketplace for Nigerian students
https://voeq.ng
  `.trim(),
};

// ===== New Device Login Alert =====
export const NEW_DEVICE_LOGIN: EmailTemplate = {
  subject: "New sign-in to your Voeq account",
  html: wrapHtml(`
    <h1>New sign-in detected</h1>
    <p>Someone signed in to your Voeq account from a new device:</p>
    <ul style="line-height: 1.8; color: #4A5C52;">
      <li><strong>Device:</strong> {{device}}</li>
      <li><strong>Location:</strong> {{location}}</li>
      <li><strong>Time:</strong> {{time}} UTC</li>
    </ul>
    <p>If this was you, you're all set. If you don't recognize this sign-in, secure your account immediately:</p>
    <div style="text-align: center;">
      <a href="https://voeq.ng/forgot-password" class="email-button">Reset password</a>
    </div>
  `),
  text: `
New sign-in detected

Someone signed in to your Voeq account from a new device:

Device: {{device}}
Location: {{location}}
Time: {{time}} UTC

If this was you, you're all set. If you don't recognize this sign-in, reset your password immediately:
https://voeq.ng/forgot-password

---
Voeq — The campus marketplace for Nigerian students
https://voeq.ng
  `.trim(),
};

// ===== Vendor Application Submitted =====
export const VENDOR_APPLICATION_SUBMITTED: EmailTemplate = {
  subject: "We received your vendor application",
  html: wrapHtml(`
    <h1>Application received</h1>
    <p>Thanks for applying to become a vendor on Voeq, {{name}}!</p>
    <p>Our team is reviewing your application. We'll email you within 2-3 business days with a decision.</p>
    <p><strong>What happens next:</strong></p>
    <ul style="line-height: 1.8; color: #4A5C52;">
      <li>We verify your campus affiliation</li>
      <li>We review your storefront details</li>
      <li>If approved, you can start listing immediately</li>
    </ul>
    <p>Questions? Reply to this email or check our <a href="https://voeq.ng/for-vendors" style="color: #2D5A3D;">vendor guide</a>.</p>
  `),
  text: `
Application received

Thanks for applying to become a vendor on Voeq, {{name}}!

Our team is reviewing your application. We'll email you within 2-3 business days with a decision.

What happens next:
- We verify your campus affiliation
- We review your storefront details
- If approved, you can start listing immediately

Questions? Reply to this email or check our vendor guide at https://voeq.ng/for-vendors

---
Voeq — The campus marketplace for Nigerian students
https://voeq.ng
  `.trim(),
};

// ===== Vendor Application Approved =====
export const VENDOR_APPLICATION_APPROVED: EmailTemplate = {
  subject: "Your vendor application was approved!",
  html: wrapHtml(`
    <h1>You're approved, {{name}}!</h1>
    <p>Great news — your vendor application has been approved. You can now create listings and start selling on Voeq.</p>
    <p><strong>Get started:</strong></p>
    <ul style="line-height: 1.8; color: #4A5C52;">
      <li>Set up your storefront</li>
      <li>Create your first listing</li>
      <li>Share your shop with your campus</li>
    </ul>
    <div style="text-align: center;">
      <a href="https://voeq.ng/vendor/dashboard" class="email-button">Go to dashboard</a>
    </div>
    <p>Need help? Check out our <a href="https://voeq.ng/for-vendors" style="color: #2D5A3D;">vendor guide</a>.</p>
  `),
  text: `
You're approved, {{name}}!

Great news — your vendor application has been approved. You can now create listings and start selling on Voeq.

Get started:
- Set up your storefront
- Create your first listing
- Share your shop with your campus

Go to your dashboard: https://voeq.ng/vendor/dashboard

Need help? Check out our vendor guide at https://voeq.ng/for-vendors

---
Voeq — The campus marketplace for Nigerian students
https://voeq.ng
  `.trim(),
};

// ===== Vendor Application Rejected =====
export const VENDOR_APPLICATION_REJECTED: EmailTemplate = {
  subject: "Update on your vendor application",
  html: wrapHtml(`
    <h1>Application decision</h1>
    <p>Thanks for your interest in becoming a vendor on Voeq, {{name}}.</p>
    <p>After reviewing your application, we're unable to approve it at this time.</p>
    <p><strong>Common reasons for rejection:</strong></p>
    <ul style="line-height: 1.8; color: #4A5C52;">
      <li>Campus affiliation could not be verified</li>
      <li>Incomplete storefront details</li>
      <li>Product category not yet supported on your campus</li>
    </ul>
    <p>You can reapply after addressing these issues. If you have questions, reply to this email.</p>
  `),
  text: `
Application decision

Thanks for your interest in becoming a vendor on Voeq, {{name}}.

After reviewing your application, we're unable to approve it at this time.

Common reasons for rejection:
- Campus affiliation could not be verified
- Incomplete storefront details
- Product category not yet supported on your campus

You can reapply after addressing these issues. If you have questions, reply to this email.

---
Voeq — The campus marketplace for Nigerian students
https://voeq.ng
  `.trim(),
};

// ===== Export all templates =====
export const EMAIL_TEMPLATES = {
  OTP_REGISTRATION,
  OTP_LOGIN,
  PASSWORD_RESET,
  WELCOME,
  ACCOUNT_SUSPENDED,
  ACCOUNT_BANNED,
  PASSWORD_CHANGED,
  NEW_DEVICE_LOGIN,
  VENDOR_APPLICATION_SUBMITTED,
  VENDOR_APPLICATION_APPROVED,
  VENDOR_APPLICATION_REJECTED,
} as const;

export type EmailTemplateKey = keyof typeof EMAIL_TEMPLATES;
