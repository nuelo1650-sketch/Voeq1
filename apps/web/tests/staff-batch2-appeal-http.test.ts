/**
 * Staff batch 2 / T7 — appeal intake HTTP round-trip (test DB server).
 * Skipped unless VOEQ_HTTP_BASE is set (batch-1 protocol). The server must
 * run with the SAME VOEQ_SESSION_SECRET the test reads from .env.local
 * (Next dev loads .env.local automatically).
 *
 * Rate-limit budget: the endpoint allows 5/15min per IP — this file makes
 * exactly 4 POSTs, so it can run twice per window if needed.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.VOEQ_HTTP_BASE ?? "";
const runHttp = Boolean(process.env.VOEQ_HTTP_BASE);
const TS = Date.now();
const TURNSTILE = "dev-bypass";

// Mint tokens with the server's own secret (lazy read in appeal-token.ts).
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

describe.skipIf(!runHttp)("staff batch 2 — appeal intake HTTP round-trip", () => {
  const victimEmail = `r83-appeal-${TS}@voeq.test`;
  const adminJar: Jar = {};
  let victimId = "";
  let token = "";

  beforeAll(async () => {
    const { res, data } = await api({}, "/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email: victimEmail, password: "AppealPass123!", name: "R83 Appellant", intent: "shopper", consent: true, turnstileToken: TURNSTILE }),
    });
    expect(res.status).toBe(200);
    const admin = await api(adminJar, "/api/dev/admin-session", { method: "POST", body: JSON.stringify({ role: "super_admin" }) });
    expect(admin.res.status).toBe(200);
    const users = await api(adminJar, `/api/staff/users?q=${encodeURIComponent(victimEmail)}`);
    expect(users.res.status).toBe(200);
    const found = (users.data.users ?? users.data).find?.((u: any) => u.email === victimEmail);
    expect(found).toBeTruthy();
    victimId = found.id;
    // Ban the victim for real (this is the decision under appeal).
    const ban = await api(adminJar, "/api/staff/account-action", {
      method: "POST",
      body: JSON.stringify({ targetIdentityId: victimId, action: "ban", reason: "Repeated harassment reports upheld against this account." }),
    });
    expect(ban.res.status).toBe(200);
    // Mint the appeal token exactly as the notification did (same secret).
    const { mintAppealToken } = await import("@voeq/data");
    token = mintAppealToken(victimId, victimEmail);
  }, 90_000);

  it("rejects tampered tokens and wrong emails with the SAME generic 400 (no oracle)", async () => {
    const dot = token.indexOf(".");
    const tampered = `${token.slice(0, dot + 1)}${token[dot + 1] === "A" ? "B" : "A"}${token.slice(dot + 2)}`;
    const r1 = await api({}, "/api/auth/appeal", {
      method: "POST",
      body: JSON.stringify({ token: tampered, email: victimEmail, message: "This ban is a mistake, I never harassed anyone." }),
    });
    expect(r1.res.status).toBe(400);
    expect(r1.data.error).toBe("invalid_token");
    const r2 = await api({}, "/api/auth/appeal", {
      method: "POST",
      body: JSON.stringify({ token, email: `wrong-${TS}@voeq.test`, message: "This ban is a mistake, I never harassed anyone." }),
    });
    expect(r2.res.status).toBe(400);
    expect(r2.data.error).toBe("invalid_token"); // identical shape
  });

  it("valid token + matching email creates ONE appeals case visible to staff", async () => {
    const r = await api({}, "/api/auth/appeal", {
      method: "POST",
      body: JSON.stringify({ token, email: victimEmail, message: "The reports were filed by a rival vendor; the messages are doctored. Please review." }),
    });
    expect(r.res.status).toBe(200);
    expect(r.data.ok).toBe(true);
    expect(r.data.updated).toBe(false);
    const cases = await api(adminJar, "/api/staff/cases?queue=appeals");
    expect(cases.res.status).toBe(200);
    const mine = (cases.data.cases as any[]).filter((c) => c.payload?.identityId === victimId);
    expect(mine.length).toBe(1);
    expect(mine[0].status).toBe("open");
    expect(String(mine[0].payload.message)).toContain("doctored");
  });

  it("re-submitting AMENDS the pending appeal instead of double-queuing", async () => {
    const r = await api({}, "/api/auth/appeal", {
      method: "POST",
      body: JSON.stringify({ token, email: victimEmail, message: "Update: I also have the original chat export proving the timestamps were faked." }),
    });
    expect(r.res.status).toBe(200);
    expect(r.data.updated).toBe(true);
    const cases = await api(adminJar, "/api/staff/cases?queue=appeals");
    const mine = (cases.data.cases as any[]).filter((c) => c.payload?.identityId === victimId && (c.status === "open" || c.status === "triaged"));
    expect(mine.length).toBe(1);
    expect(String(mine[0].payload.message)).toContain("chat export");
    expect(Array.isArray(mine[0].payload.history)).toBe(true);
    expect(mine[0].payload.history.length).toBeGreaterThanOrEqual(1);
  });

  it("staff can resolve the appeal case (queue drains)", async () => {
    const cases = await api(adminJar, "/api/staff/cases?queue=appeals");
    const mine = (cases.data.cases as any[]).find((c) => c.payload?.identityId === victimId && c.status !== "resolved");
    expect(mine).toBeTruthy();
    const r = await api(adminJar, "/api/staff/cases", {
      method: "POST",
      body: JSON.stringify({ caseId: mine.id, action: "dismiss", resolution: "Reviewed chat logs; ban upheld — harassment confirmed." }),
    });
    expect(r.res.status).toBe(200);
    const after = await api(adminJar, "/api/staff/cases?queue=appeals");
    const still = (after.data.cases as any[]).find((c) => c.id === mine.id);
    expect(still?.status).toBe("dismissed");
  });
});
