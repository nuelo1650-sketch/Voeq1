import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 700, height: 900 } });
  for (const name of ["OTP_REGISTRATION", "OTP_LOGIN", "WELCOME", "PASSWORD_RESET"]) {
    const html = `C:/Users/Legacy/AppData/Local/Temp/email-${name}.html`;
    await page.goto("file:///" + html.replace(/\\/g, "/"), { waitUntil: "load" });
    await page.waitForTimeout(400);
    await page.setViewportSize({ width: 700, height: 640 });
    await page.screenshot({ path: `C:/Users/Legacy/AppData/Local/Temp/shot-${name}.png`, fullPage: true });
    console.log("shot", name);
  }
  await browser.close();
})().catch((e) => { console.error("FATAL:", e); process.exit(1); });
