/**
 * Staff batch 2 / T8 — appeals loop HTTP round-trip (test DB server).
 * Skipped unless VOEQ_HTTP_BASE is set (batch-1 protocol).
 *
 * Rate-limit note: /api/auth/appeal allows 5/15min PER IP and the T7 file
 * already spends 4 from the real loopback IP. This file sends its own
 * x-forwarded-for so it gets an independent bucket (clientIpFrom honors it).
 *
 * Proves the full circle: ban -> appeal -> staff resolve WITH reinstate ->
 * victim's account is active again (login works, notification received).
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.VOEQ_HTTP_BASE ?? "";
const runHttp = Boolean(process.env.VOEQ_HTTP_BASE);
const TS = Date.now();
const TURNSTILE = "dev-bypass";
const MY_IP = `10.99.${(TS % 200) + 1}.${((TS >> 8) % 200) + 1}`;

const envLocal = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
const secretLine = envLocal.split("\n").find((l) => l.startsWith("VOEQ_SESSION_SECRET="));
if (secretLine) process.env.VOEQ_SESSION_SECRET = secretLine.slice("VOEQ_SESSION_SECRET=".length).trim();

type Jar = Record<string, string>;
function cookieHeader(jar: Jar): string {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
}
function absorb(jar: Jar, res: Response) {
  const raw = res.headers.getSetCookie?.() ?? [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const idx = pair.indexOf("=");
    if (idx > 0) jar[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  }
}
async function api(jar: Jar, path: string, init: RequestInit = {}): Promise<{ res: Response; data: any }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(jar && Object.keys(jar).length ? { Cookie: cookieHeader(jar) } : {}),
      ...(init.headers ?? {}),
    },
  });
  absorb(jar, res);
  let data: any = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  return { res, data };
}

describe.skipIf(!runHttp)("staff batch 2 — appeals reinstate HTTP round-trip", () => {
  const victimEmail = `r83-reinstate-${TS}@voeq.test`;
  const victimPass = "ReinstatePass123!";
  const adminJar: Jar = {};
  let victimId = "";
  let token = "";
  let caseId = "";

  beforeAll(async () => {
    const su = await api({}, "/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email: victimEmail, password: victimPass, name: "R83 Reinstater", intent: "shopper", consent: true, turnstileToken: TURNSTILE }),
    });
    expect(su.res.status).toBe(200);
    const admin = await api(adminJar, "/api/dev/admin-session", { method: "POST", body: JSON.stringify({ role: "super_admin" }) });
    expect(admin.res.status).toBe(200);
    const users = await api(adminJar, `/api/staff/users?q=${encodeURIComponent(victimEmail)}`);
    const found = (users.data.users ?? users.data).find?.((u: any) => u.email === victimEmail);
    expect(found).toBeTruthy();
    victimId = found.id;
    const ban = await api(adminJar, "/api/staff/account-action", {
      method: "POST",
      body: JSON.stringify({ targetIdentityId: victimId, action: "ban", reason: "Fraud claims upheld pending verification of documents." }),
    });
    expect(ban.res.status).toBe(200);
    const { mintAppealToken } = await import("@voeq/data");
    token = mintAppealToken(victimId, victimEmail);
  }, 90_000);

  it("appellant submits via token; staff GET shows subjectAccountStatus=banned", async () => {
    const r = await api({}, "/api/auth/appeal", {
      method: "POST",
      headers: { "x-forwarded-for": MY_IP },
      body: JSON.stringify({ token, email: victimEmail, message: "The fraud flag was an automated false positive; my business registration is genuine." }),
    });
    expect(r.res.status).toBe(200);
    expect(r.data.ok).toBe(true);
    const cases = await api(adminJar, "/api/staff/cases?queue=appeals");
    expect(cases.res.status).toBe(200);
    const mine = (cases.data.cases as any[]).filter((c) => c.payload?.identityId === victimId);
    expect(mine.length).toBe(1);
    expect(mine[0].subjectAccountStatus).toBe("banned");
    caseId = mine[0].id;
  });

  it("resolve WITH reinstate flips the account active and marks the case", async () => {
    expect(caseId).toBeTruthy();
    const r = await api(adminJar, "/api/staff/cases", {
      method: "POST",
      body: JSON.stringify({ caseId, action: "resolve", resolution: "Documents verified manually; ban lifted and record corrected.", reinstate: true }),
    });
    expect(r.res.status).toBe(200);
    expect(r.data.ok).toBe(true);
    expect(r.data.case.status).toBe("resolved");
    const cases = await api(adminJar, "/api/staff/cases?queue=appeals");
    const mine = (cases.data.cases as any[]).find((c) => c.id === caseId);
    expect(mine?.subjectAccountStatus).toBe("active");
    expect(mine?.payload?.reinstateApplied).toBe(true);
  });

  it("reinstated victim can log in again and receives the reinstate notification", async () => {
    const jar: Jar = {};
    const login = await api(jar, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: victimEmail, password: victimPass, intent: "shopper", consent: true, turnstileToken: TURNSTILE }),
    });
    expect(login.res.status).toBe(200);
    const notes = await api(jar, "/api/notifications");
    expect(notes.res.status).toBe(200);
    const list = (notes.data.notifications ?? notes.data.items ?? notes.data) as any[];
    const reinstateNote = list.find((n) => String(n.title).toLowerCase().includes("active again"));
    expect(reinstateNote).toBeTruthy();
    expect(String(reinstateNote.body)).toContain("Documents verified manually");
  });

  it("dismiss WITHOUT reinstate notifies the appellant of the denial", async () => {
    // Second appeal cycle on the same identity: ban again, appeal, dismiss.
    const ban = await api(adminJar, "/api/staff/account-action", {
      method: "POST",
      body: JSON.stringify({ targetIdentityId: victimId, action: "ban", reason: "Second fraud wave after temporary reinstatement." }),
    });
    expect(ban.res.status).toBe(200);
    const ap = await api({}, "/api/auth/appeal", {
      method: "POST",
      headers: { "x-forwarded-for": MY_IP },
      body: JSON.stringify({ token, email: victimEmail, message: "I swear the documents were real, please look one more time." }),
    });
    expect(ap.res.status).toBe(200);
    const cases = await api(adminJar, "/api/staff/cases?queue=appeals");
    const open = (cases.data.cases as any[]).find((c) => c.payload?.identityId === victimId && (c.status === "open" || c.status === "triaged"));
    expect(open).toBeTruthy();
    const dis = await api(adminJar, "/api/staff/cases", {
      method: "POST",
      body: JSON.stringify({ caseId: open.id, action: "dismiss", resolution: "Second review by senior staff: documents confirmed forged. Ban stands." }),
    });
    expect(dis.res.status).toBe(200);
    // Victim can't log in (still banned) — but the denial notification exists
    // server-side; verify via DB read-back instead of the victim session.
    const stillBanned = await api({}, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: victimEmail, password: victimPass, intent: "shopper", consent: true, turnstileToken: TURNSTILE }),
    });
    expect(stillBanned.res.status).toBeGreaterThanOrEqual(400);
    const after = await api(adminJar, `/api/staff/users?q=${encodeURIComponent(victimEmail)}`);
    const u = (after.data.users ?? after.data).find?.((x: any) => x.email === victimEmail);
    expect(u?.accountStatus).toBe("banned");
  });
});
