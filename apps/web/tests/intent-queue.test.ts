/**
 * Phase 1 round-trip: the post-auth intent queue, over live HTTP.
 * 1) signup -> verify -> consent (fresh account, becomes active)
 * 2) log out
 * 3) log in carrying intent=message:<vendorId>&next=/v/<slug>
 *    — login redirect must preserve BOTH the page and the intent
 * 4) consent (if re-required) must also honor next+intent
 * Proves the loop is broken: intent survives the gate instead of being dropped.
 */
import { describe, it, expect } from "vitest";

const BASE = process.env.VOEQ_HTTP_BASE ?? "http://localhost:3030";
// HTTP integration test: skipped by default so a routine `vitest run` never
// touches the launch DB. Set VOEQ_HTTP_BASE to run it against a test server.
const runHttp = Boolean(process.env.VOEQ_HTTP_BASE);
const TS = Date.now();
const SHOPPER = { email: `intent-${TS}@voeq.ng`, password: "IntentPass123!", name: "Intent Shopper" };

type Jar = Record<string, string>;
function cookieHeader(jar: Jar) {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
}
function absorb(jar: Jar, res: Response) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    if (i > 0) jar[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  }
}
async function api(jar: Jar, path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(Object.keys(jar).length ? { Cookie: cookieHeader(jar) } : {}) },
  });
  absorb(jar, res);
  return { res, data: await res.json().catch(() => null) };
}
async function devOtp(email: string) {
  const { data } = await api({}, "/api/dev/otp", { method: "POST", body: JSON.stringify({ email, purpose: "registration" }) });
  if (!data?.code) throw new Error(`devOtp: ${JSON.stringify(data)}`);
  return data.code;
}

describe.skipIf(!runHttp)("Phase 1: post-auth intent queue", () => {
  it("login preserves intent; consent honors next+intent", async () => {
    // 1) create + fully verify + consent the account
    const jar: Jar = {};
    const su = await api(jar, "/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ ...SHOPPER, intent: "shopper", consent: true }),
    });
    expect(su.res.status).toBe(200);
    expect(su.data.pendingToken).toBeTruthy();

    const code = await devOtp(SHOPPER.email);
    const ver = await api(jar, "/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ token: su.data.pendingToken, code }),
    });
    expect(ver.res.status).toBe(200);
    await api(jar, "/api/auth/consent", { method: "POST" });

    // 2) log out
    await api(jar, "/api/auth/logout", { method: "POST" });

    // 3) THE TEST: log in carrying a message intent + the page the user was on
    const jar2: Jar = {};
    const li = await api(jar2, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...SHOPPER, turnstileToken: "dev-bypass", next: "/v/some-vendor", intent: "message:vendor-123" }),
    });
    expect(li.res.status).toBe(200);
    expect(li.data.ok).toBe(true);
    expect(li.data.redirect).toContain("/v/some-vendor");
    expect(li.data.redirect).toContain("intent=message%3Avendor-123");

    // 4) consent chain honors next+intent (would resume the action)
    const con = await api(jar2, "/api/auth/consent?next=%2Fv%2Fsome-vendor&intent=message%3Avendor-123", { method: "POST" });
    if (con.res.status === 200) {
      expect(con.data.redirect).toContain("/v/some-vendor");
      expect(con.data.redirect).toContain("intent=message%3Avendor-123");
    }
  }, 60000);
});
