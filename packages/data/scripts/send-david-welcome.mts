import { sendEmail } from "../src/email";
import { readFileSync } from "fs";

// Load the live Resend config from apps/web/.env.local (the real key + sender).
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const key = /^RESEND_API_KEY=(.+)$/m.exec(env)?.[1];
const from = /^RESEND_FROM_EMAIL=(.+)$/m.exec(env)?.[1];
if (key) process.env.RESEND_API_KEY = key.trim();
if (from) process.env.RESEND_FROM_EMAIL = from.trim();

async function main() {
  // Send the REAL WELCOME email to David's gmail via the live Resend config,
  // so he can confirm delivery (and see the modern design in his inbox).
  const r = await sendEmail({
    to: "owidavid2002@gmail.com",
    template: "WELCOME",
    vars: { name: "David" },
  });
  console.log("RESULT:", JSON.stringify(r, null, 1));
  process.exit(r.ok ? 0 : 1);
}
main();
