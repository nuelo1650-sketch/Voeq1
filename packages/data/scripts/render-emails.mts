import { renderEmail, EMAIL_TEMPLATES } from "../src/email-templates";
import { writeFileSync } from "fs";

// Render the real templates with a sample code/name and save as HTML for inspection.
const samples: Record<string, Record<string, string>> = {
  OTP_REGISTRATION: { code: "483207" },
  OTP_LOGIN: { code: "576149" },
  WELCOME: { name: "David" },
  PASSWORD_RESET: { resetLink: "https://voeq.ng/reset-password?token=abc123" },
};

for (const [key, vars] of Object.entries(samples)) {
  const def = EMAIL_TEMPLATES[key as keyof typeof EMAIL_TEMPLATES];
  if (!def) { console.log("MISSING:", key); continue; }
  const rendered = renderEmail(def, vars);
  writeFileSync(`C:/Users/Legacy/AppData/Local/Temp/email-${key}.html`, rendered.html);
  console.log(key, "->", rendered.subject, "| html bytes:", rendered.html.length);
}
