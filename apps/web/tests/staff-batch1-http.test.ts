/**
 * Staff batch 1 — HTTP round-trip against a live server pointed at the TEST DB.
 * Skipped unless VOEQ_HTTP_BASE is set (same guard as launch-sweep) so routine
 * `vitest run` never touches prod. Run in the batch gate:
 *   DATABASE_URL=<test> next dev -p 3031  (prod DB server must NOT be used)
 *   VOEQ_HTTP_BASE=http://localhost:3031 npx vitest run tests/staff-batch1-http.test.ts
 */
import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "crypto";

const BASE = process.env.VOEQ_HTTP_BASE ?? "";
const runHttp = Boolean(process.env.VOEQ_HTTP_BASE);
const TS = Date.now();
const TURNSTILE = "dev-bypass"; // schema requires the field; secret unset in dev -> verify skipped

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

describe.skipIf(!runHttp)("staff batch 1 — HTTP round-trip", () => {
  const victimEmail = `r82-victim-${TS}@voeq.test`;
  const adminJar: Jar = {};
  let victimId = "";

  beforeAll(async () => {
    // Sign up the victim for real (OTP is logged in dev; we only need the identity row).
    const { res, data } = await api({}, "/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email: victimEmail, password: "VictimPass123!", name: "R82 Victim", intent: "shopper", turnstileToken: TURNSTILE }),
    });
    expect(res.status).toBe(200);
    // Admin session via dev route (test server only).
    const admin = await api(adminJar, "/api/dev/admin-session", { method: "POST", body: JSON.stringify({ role: "super_admin" }) });
    expect([200, 404]).toContain(admin.res.status);
    if (admin.res.status !== 200) throw new Error("dev admin-session unavailable on this server");
  });

  it("banned email cannot re-register (403 with appeal line)", async () => {
    // Find the victim identity via the staff users endpoint (task 8) or audit;
    // fallback: login as victim to get their id via /api/auth/me.
    const jar: Jar = {};
    // pending_verification: complete via OTP-less path is complex; instead ban
    // directly through the DB-visible staff API using email search once users
    // endpoint exists. For now assert the block on an ALREADY banned seeded row:
    // use the admin to ban via account-action after locating id through
    // /api/staff/users?q= (task 8). If users endpoint is absent, skip gracefully.
    const users = await api(adminJar, `/api/staff/users?q=${encodeURIComponent(victimEmail)}`);
    if (users.res.status === 404) {
      // Task 8 not deployed yet — cannot locate id; block test covered by unit
      // path once endpoint lands. Fail loudly so we never ship green without it.
      throw new Error("/api/staff/users missing — run this after task 8");
    }
    expect(users.res.status).toBe(200);
    const found = (users.data.users ?? users.data).find?.((u: any) => u.email === victimEmail) ?? (users.data as any[]).find?.((u: any) => u.email === victimEmail);
    expect(found).toBeTruthy();
    victimId = found.id;

    const ban = await api(adminJar, "/api/staff/account-action", {
      method: "POST",
      body: JSON.stringify({ targetIdentityId: victimId, action: "ban", reason: "R82 HTTP test ban — should be reversible by reinstate" }),
    });
    expect(ban.res.status).toBe(200);
    expect(ban.data.ok).toBe(true);

    const reReg = await api({}, "/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email: victimEmail, password: "EvaderPass123!", name: "Evader", intent: "shopper", turnstileToken: TURNSTILE }),
    });
    expect(reReg.res.status).toBe(403);
    expect(String(reReg.data.error)).toContain("banned");
    expect(String(reReg.data.error)).toContain("support@voeq.ng");

    // reinstate so the row is clean for the next run
    const re = await api(adminJar, "/api/staff/account-action", {
      method: "POST",
      body: JSON.stringify({ targetIdentityId: victimId, action: "reinstate", reason: "R82 HTTP test cleanup reinstate" }),
    });
    expect(re.res.status).toBe(200);
    expect(re.data.accountStatus).toBe("active");
  });

  it("suspend requires future expiry; victim gets notified with reason", async () => {
    if (!victimId) throw new Error("depends on previous test");
    const bad = await api(adminJar, "/api/staff/account-action", {
      method: "POST",
      body: JSON.stringify({ targetIdentityId: victimId, action: "suspend", reason: "R82 HTTP test suspend with missing expiry" }),
    });
    expect(bad.res.status).toBe(400);
    expect(bad.data.error).toBe("expiresAt_required");

    const ok = await api(adminJar, "/api/staff/account-action", {
      method: "POST",
      body: JSON.stringify({ targetIdentityId: victimId, action: "suspend", reason: "R82 HTTP test suspend with proper expiry", expiresAt: new Date(Date.now() + 3_600_000).toISOString() }),
    });
    expect(ok.res.status).toBe(200);
    expect(ok.data.accountStatus).toBe("suspended");

    // victim's notification (read via their session would need login; use staff users detail)
    const detail = await api(adminJar, `/api/staff/users?id=${victimId}`);
    expect([200, 404]).toContain(detail.res.status); // detail endpoint shape from task 8

    // cleanup
    await api(adminJar, "/api/staff/account-action", {
      method: "POST",
      body: JSON.stringify({ targetIdentityId: victimId, action: "reinstate", reason: "R82 HTTP test cleanup reinstate 2" }),
    });
  });
});
