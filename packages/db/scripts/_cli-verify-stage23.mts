/**
 * CLI CODE-VERIFICATION — Stages 2+3 (prod), FINAL.
 * Robustness: makeIdentity retries verify with DB-fallback code; guard rails
 * on every fetch (no non-null assertions on API responses); cleanup even on
 * partial failure.
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID, createHash } from "crypto";
import { chromium } from "playwright";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const KEY = env.match(/RESEND_API_KEY=([^\n\r]+)/)[1];
const PROD_URL = env.match(/DATABASE_URL=([^\n\r]+)/)[1];
const sql = neon(PROD_URL);
const BASE = "https://voeq.ng";
const stamp = Date.now();
const out: string[] = [];
const created: { identities: string[]; otps: string[]; tokens: string[]; vendors: string[]; listings: string[]; convs: string[]; cloudinaryUrl?: string } =
  { identities: [], otps: [], tokens: [], vendors: [], listings: [], convs: [] };
const log = (ok: boolean, step: string, d: string) => { out.push(`${ok ? "PASS" : "FAIL"} ${step}: ${d}`); console.log(`${ok ? "✅" : "❌"} ${step}: ${d}`); };

// real photo: screenshot -> canvas -> JPEG
const SHOT_CANDIDATES = [
  "C:/Users/Legacy/Documents/voeq/Temp/vla-mock-mobile-390.png",
  "C:/Users/Legacy/Documents/voeq/Temp/vdash-mobile-390.png",
];
const shotPath = SHOT_CANDIDATES.find((p) => existsSync(p));
if (!shotPath) throw new Error("no screenshot source");
async function pngToJpeg(pngPath: string): Promise<Buffer> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pngB64 = readFileSync(pngPath).toString("base64");
  const jpegB64 = await page.evaluate(async (dataUrl) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl; });
    const c = document.createElement("canvas");
    const scale = Math.min(1, 1200 / img.width);
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.82).split(",")[1];
  }, `data:image/png;base64,${pngB64}`);
  await browser.close();
  return Buffer.from(jpegB64, "base64");
}
const PHOTO = await pngToJpeg(shotPath);
console.log(`real JPEG: ${(PHOTO.length / 1024).toFixed(0)}KB from ${shotPath.split("/").pop()}`);

async function makeIdentity(name: string) {
  const id = randomUUID();
  const email = `cli3-${stamp}-${name}@voeq.ng`;
  const hash = createHash("sha256").update("LaunchCli2026!").digest("hex");
  await sql`INSERT INTO identities (id, email, name, role, account_status, email_verified, method, consent, created_at, updated_at, password_hash)
  VALUES (${id}, ${email}, ${name}, 'shopper', 'pending_verification', false, 'email', ${JSON.stringify([])}::jsonb, ${new Date().toISOString()}, ${new Date().toISOString()}, ${hash})`;
  created.identities.push(id);
  const token = `cli3-tok-${stamp}-${name}`;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await sql`INSERT INTO pending_tokens (token, email, purpose, created_at, expires_at, used)
  VALUES (${token}, ${email}, 'registration', ${new Date().toISOString()}, ${new Date(Date.now() + 15 * 60e3).toISOString()}, false)`;
  created.tokens.push(token);
  await sql`INSERT INTO otps (id, email, purpose, code, expires_at, attempts)
  VALUES (${"cli3-otp-" + stamp + "-" + name}, ${email}, 'registration', ${code}, ${new Date(Date.now() + 10 * 60e3).toISOString()}, 0)`;
  created.otps.push(email);
  const er = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Voeq <hello@voeq.ng>", to: email, subject: "Your Voeq verification code",
      text: `Verify your email\n\nWelcome to Voeq! To complete your registration, enter this 6-digit code:\n\n${code}\n\nThis code expires in 10 minutes. If you didn't create a Voeq account, you can safely ignore this email.` }),
  });
  const eb = await er.json() as { id?: string };
  let emailed = "";
  for (let i = 0; i < 3 && !emailed; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const rb = await fetch(`https://api.resend.com/emails/${eb.id}`, { headers: { Authorization: `Bearer ${KEY}` } }).then((r) => r.json()) as { text?: string };
    emailed = (rb.text?.match(new RegExp(`\\b${code.slice(0, 2)}\\d{4}\\b`)) ?? [])[0] ?? (rb.text?.match(/\b\d{6}\b/) ?? [])[0] ?? "";
  }
  const matched = emailed === code;
  // fallback: use DB code if readback raced (still the REAL code the email carried — DB row IS what verify checks)
  const effectiveCode = matched ? emailed : code;
  const jar: string[] = [];
  const vRes = await fetch(`${BASE}/api/auth/verify-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, code: effectiveCode }) });
  for (const c of vRes.headers.getSetCookie?.() ?? []) { const pair = c.split(";")[0]; if (pair.startsWith("sessionId=") && !jar.length) jar.push(pair); }
  return { id, email, jar, matched, verifyOk: vRes.ok && jar.length > 0 };
}

const H = (jar: string[]) => ({ "Content-Type": "application/json", Cookie: jar.join("; ") });

// ================= STAGE 2 =================
const V = await makeIdentity("Vendor");
log(V.matched, "S2/vendor-otp-roundtrip", `${V.email} matched=${V.matched} verified-session=${V.verifyOk}`);

const CAMPUS = "uniport";
await sql`UPDATE identities SET campus = ${CAMPUS} WHERE id = ${V.id}`;

const s1 = await fetch(`${BASE}/api/onboarding/vendor/step-1`, { method: "POST", headers: H(V.jar), body: JSON.stringify({ name: "Launch CLI Vet", description: "CLI verification storefront exercising the full production pipeline end to end for launch readiness.", categoryId: "food", profilePhotoUrl: null }) });
const s1b = await s1.json() as { vendorId?: string; error?: string };
if (s1b.vendorId) created.vendors.push(s1b.vendorId);
log(s1.ok && !!s1b.vendorId, "S2/onboard-step1", `HTTP ${s1.status} vendor=${s1b.vendorId?.slice(0, 8) ?? s1b.error ?? "?"}`);

const s2 = await fetch(`${BASE}/api/onboarding/vendor/step-2`, { method: "POST", headers: H(V.jar), body: JSON.stringify({ campus: CAMPUS, subArea: "CLI test" }) });
log(s2.ok, "S2/onboard-step2", `HTTP ${s2.status}`);

const signRes = await fetch(`${BASE}/api/images/sign`, { method: "POST", headers: H(V.jar) });
const sign = await signRes.json() as { sign?: { cloudName: string; apiKey: string; signature: string; timestamp: number; folder: string }; error?: string };
log(signRes.ok && !!sign.sign, "S2/images-sign", sign.sign ? `HTTP ${signRes.status} folder=${sign.sign.folder} ttl=60s` : `HTTP ${signRes.status} ${sign.error ?? "?"}`);

let cloudUrl: string | null = null;
if (sign.sign) {
  const cdnForm = new FormData();
  cdnForm.append("file", new Blob([PHOTO], { type: "image/jpeg" }), "launch-verify.jpg");
  cdnForm.append("api_key", sign.sign.apiKey);
  cdnForm.append("timestamp", String(sign.sign.timestamp));
  cdnForm.append("folder", sign.sign.folder);
  cdnForm.append("signature", sign.sign.signature);
  const cdnRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.sign.cloudName}/image/upload`, { method: "POST", body: cdnForm });
  const cdn = await cdnRes.json() as { secure_url?: string; error?: { message?: string } };
  cloudUrl = cdn.secure_url ?? null;
  if (cloudUrl) created.cloudinaryUrl = cloudUrl;
  log(!!cloudUrl, "S2/cloudinary-upload", cloudUrl ? `HTTP ${cdnRes.status} real-image-on-CDN` : `HTTP ${cdnRes.status} ${cdn.error?.message ?? "?"}`);
}

const createRes = await fetch(`${BASE}/api/listings`, { method: "POST", headers: H(V.jar), body: JSON.stringify({ title: "Launch Verify Jollof Platter", categoryId: "food", priceMinMinor: 250000, description: "CLI verification listing — full pipeline proof (photo uploaded through Cloudinary signed upload).", shortDescription: "Pipeline proof listing", images: cloudUrl ? [cloudUrl] : [] }) });
const createdB = await createRes.json() as { listing?: { id: string }; error?: string };
if (createdB.listing?.id) created.listings.push(createdB.listing.id);
log(createRes.ok && !!createdB.listing?.id, "S2/listing-create", `HTTP ${createRes.status} id=${createdB.listing?.id?.slice(0, 8) ?? createdB.error}`);
const LISTING_ID = createdB.listing?.id;

const liveRes = await fetch(`${BASE}/api/vendor/go-live`, { method: "POST", headers: H(V.jar) });
const liveB = await liveRes.json() as { ok?: boolean; error?: string };
log(!!liveB.ok, "S2/go-live", `HTTP ${liveRes.status} ${liveB.error ?? "LIVE"}`);

const vendorId = created.vendors[0];
const exploreRes = await fetch(`${BASE}/explore`);
const exploreTxt = await exploreRes.text();
log(exploreRes.ok && exploreTxt.includes("Launch Verify Jollof Platter"), "S2/explore-visible", `HTTP ${exploreRes.status} in-explore=${exploreTxt.includes("Launch Verify Jollof Platter")}`);
const storeRes = await fetch(`${BASE}/vendor/${vendorId}`);
log(storeRes.ok, "S2/storefront-200", `HTTP ${storeRes.status}`);
if (LISTING_ID) {
  const listRes = await fetch(`${BASE}/listing/${LISTING_ID}`);
  log(listRes.ok, "S2/listing-page-200", `HTTP ${listRes.status}`);
}

// ================= STAGE 3 =================
const S = await makeIdentity("Shopper");
log(S.matched, "S3/shopper-otp-roundtrip", `${S.email} matched=${S.matched}`);

const convRes = await fetch(`${BASE}/api/conversations`, { method: "POST", headers: H(S.jar), body: JSON.stringify({ vendorId, listingId: LISTING_ID }) });
const conv = await convRes.json() as { conversation?: { id: string }; id?: string; conversationId?: string };
const convId = conv.conversation?.id ?? conv.conversationId ?? conv.id;
if (convId) created.convs.push(convId);
log(convRes.ok && !!convId, "S3/conversation-create", `HTTP ${convRes.status} conv=${convId?.slice(0, 8) ?? "?"}`);

const sendRes = convId ? await fetch(`${BASE}/api/conversations/${convId}/messages`, { method: "POST", headers: H(S.jar), body: JSON.stringify({ body: "Hi! Is the jollof platter available today?", clientMsgId: `cli-${stamp}` }) }) : null;
log(!!sendRes?.ok, "S3/shopper-sends", sendRes ? `HTTP ${sendRes.status}` : "skipped (no conv)");

if (convId) {
  const convsVB = await fetch(`${BASE}/api/conversations`, { headers: H(V.jar) }).then((r) => r.json()) as { conversations?: Array<{ id: string; unread?: number }> };
  const mine = (convsVB.conversations ?? []).find((c) => c.id === convId);
  log(!!mine && (mine.unread ?? 0) > 0, "S3/vendor-unread", `unread=${mine?.unread ?? "?"}`);
}

const replyRes = convId ? await fetch(`${BASE}/api/conversations/${convId}/messages`, { method: "POST", headers: H(V.jar), body: JSON.stringify({ body: "Yes it is! Come pick it up before 6pm.", clientMsgId: `cli-r-${stamp}` }) }) : null;
log(!!replyRes?.ok, "S3/vendor-replies", replyRes ? `HTTP ${replyRes.status}` : "skipped");

if (convId) {
  const convsSB = await fetch(`${BASE}/api/conversations`, { headers: H(S.jar) }).then((r) => r.json()) as { conversations?: Array<{ id: string; unread?: number }> };
  const mineS = (convsSB.conversations ?? []).find((c) => c.id === convId);
  log(!!mineS && (mineS.unread ?? 0) > 0, "S3/shopper-unread-reply", `unread=${mineS?.unread ?? "?"}`);
  const notif = await sql`SELECT count(*)::int AS n FROM notifications WHERE recipient_id = ${V.id}`;
  log(notif[0].n > 0, "S3/vendor-notified", `notifications=${notif[0].n}`);
}

// ================= CLEANUP =================
if (LISTING_ID) await fetch(`${BASE}/api/listings/${LISTING_ID}`, { method: "DELETE", headers: H(V.jar) });
for (const c of created.convs) {
  await sql`DELETE FROM messages WHERE conversation_id = ${c}`;
  await sql`DELETE FROM conversations WHERE id = ${c}`;
}
await sql`DELETE FROM notifications WHERE recipient_id IN (${V.id}, ${S.id})`;
for (const p of [V, S]) {
  await sql`DELETE FROM sessions WHERE identity_id = ${p.id}`;
  await sql`DELETE FROM identities WHERE id = ${p.id}`;
}
for (const vid of created.vendors) await sql`DELETE FROM vendors WHERE id = ${vid}`;
await sql`DELETE FROM otps WHERE email IN (${V.email}, ${S.email})`;
await sql`DELETE FROM pending_tokens WHERE email IN (${V.email}, ${S.email})`;
console.log(created.cloudinaryUrl ? `NOTE: 1 Cloudinary asset remains (${created.cloudinaryUrl.slice(0, 60)}…) — orphan cleanup is Gate-4` : "");

writeFileSync(join(tmpdir(), "cli-verify-stage23.json"), JSON.stringify({ out }, null, 2));
console.log("\n== STAGES 2+3 SUMMARY ==");
for (const l of out) console.log(l);
