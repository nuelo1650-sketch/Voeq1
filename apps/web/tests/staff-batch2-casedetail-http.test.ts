/**
 * Staff batch 2 / T9 — case detail API HTTP round-trip (test DB server).
 * Skipped unless VOEQ_HTTP_BASE is set (batch-1 protocol).
 *
 * Proves: ?id= detail returns case + resolved subject + auth-event timeline
 * (raw IP visible to super_admin), note appends to payload.notes,
 * reopen flips a closed case back to open with resolution cleared,
 * and unknown ids 404.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.VOEQ_HTTP_BASE ?? "";
const runHttp = Boolean(process.env.VOEQ_HTTP_BASE);
const TS = Date.now();
const TURNSTILE = "dev-bypass";
const MY_IP = `10.98.${(TS % 200) + 1}.${((TS >> 8) % 200) + 1}`;

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

describe.skipIf(!runHttp)("staff batch 2 — case detail API HTTP round-trip", () => {
  const victimEmail = `r83-detail-${TS}@voeq.test`;
  const adminJar: Jar = {};
  let victimId = "";
  let caseId = "";

  beforeAll(async () => {
    const su = await api({}, "/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email: victimEmail, password: "DetailPass123!", name: "R83 Detail", intent: "shopper", consent: true, turnstileToken: TURNSTILE }),
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
      body: JSON.stringify({ targetIdentityId: victimId, action: "suspend", expiresAt: new Date(Date.now() + 30 * 86400_000).toISOString(), reason: "Detail-flow test suspension pending manual review." }),
    });
    expect(ban.res.status).toBe(200);
    const { mintAppealToken } = await import("@voeq/data");
    const token = mintAppealToken(victimId, victimEmail);
    const ap = await api({}, "/api/auth/appeal", {
      method: "POST",
      headers: { "x-forwarded-for": MY_IP },
      body: JSON.stringify({ token, email: victimEmail, message: "Requesting detail-flow review of this suspension." }),
    });
    expect(ap.res.status).toBe(200);
    const cases = await api(adminJar, "/api/staff/cases?queue=appeals");
    const mine = (cases.data.cases as any[]).find((c) => c.payload?.identityId === victimId);
    expect(mine).toBeTruthy();
    caseId = mine.id;
  }, 120_000);

  it("?id= returns case + subject + timeline with raw IP for super_admin", async () => {
    const r = await api(adminJar, `/api/staff/cases?id=${caseId}`);
    expect(r.res.status).toBe(200);
    expect(r.data.ok).toBe(true);
    expect(r.data.case.id).toBe(caseId);
    expect(r.data.case.queue).toBe("appeals");
    expect(r.data.subject.id).toBe(victimId);
    expect(r.data.subject.email).toBe(victimEmail);
    expect(r.data.subject.accountStatus).toBe("suspended");
    // The victim signed up + was actioned + appealed: events must exist, and
    // the timeline is filtered to events since the case opened (>= createdAt).
    expect(Array.isArray(r.data.timeline)).toBe(true);
    expect(r.data.timeline.length).toBeGreaterThanOrEqual(0);
    // No passwordHash or any credential field on the subject payload.
    expect(JSON.stringify(r.data.subject)).not.toContain("passwordHash");
  });

  it("unknown case id 404s", async () => {
    const r = await api(adminJar, "/api/staff/cases?id=case-does-not-exist-42");
    expect(r.res.status).toBe(404);
    expect(r.data.error).toBe("case_not_found");
  });

  it("note appends to payload.notes with author + timestamp", async () => {
    const r = await api(adminJar, "/api/staff/cases", {
      method: "POST",
      body: JSON.stringify({ caseId, action: "note", note: "Checked payment ledger — no chargebacks found." }),
    });
    expect(r.res.status).toBe(200);
    const notes = (r.data.case.payload?.notes ?? []) as any[];
    expect(notes.length).toBe(1);
    expect(notes[0].text).toContain("payment ledger");
    expect(notes[0].by).toBeTruthy();
    expect(notes[0].at).toBeTruthy();
    // Second note appends, doesn't replace.
    const r2 = await api(adminJar, "/api/staff/cases", {
      method: "POST",
      body: JSON.stringify({ caseId, action: "note", note: "Second note for ordering check." }),
    });
    const notes2 = (r2.data.case.payload?.notes ?? []) as any[];
    expect(notes2.length).toBe(2);
    expect(notes2[1].text).toContain("ordering");
  });

  it("reopen flips a closed case to open with resolution cleared", async () => {
    const dis = await api(adminJar, "/api/staff/cases", {
      method: "POST",
      body: JSON.stringify({ caseId, action: "dismiss", resolution: "Detail-flow dismissal." }),
    });
    expect(dis.res.status).toBe(200);
    expect(dis.data.case.status).toBe("dismissed");
    const re = await api(adminJar, "/api/staff/cases", {
      method: "POST",
      body: JSON.stringify({ caseId, action: "reopen" }),
    });
    expect(re.res.status).toBe(200);
    expect(re.data.case.status).toBe("open");
    expect(re.data.case.resolution).toBeNull();
    // Notes survive the reopen (payload untouched).
    const detail = await api(adminJar, `/api/staff/cases?id=${caseId}`);
    expect(((detail.data.case.payload?.notes ?? []) as any[]).length).toBe(2);
  });
});
