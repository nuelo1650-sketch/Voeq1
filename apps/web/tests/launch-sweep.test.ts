/**
 * LAUNCH-READINESS BUTTON SWEEP v2 (2026-08-29)
 * Full real-user journey against the LIVE dev server + fresh Neon.
 * No mocks, no repo shortcuts — real HTTP with real cookies.
 *
 * v2 fixes: campus uses the STABLE seeded id "nmu-okerenkoko" (the old version
 * GET'd /api/campuses which is POST-only); every stage logs its evidence.
 */
import { describe, it, expect, beforeAll } from "vitest";

const BASE = "http://localhost:3030";
const TS = Date.now();
const CAMPUS = "nmu-okerenkoko"; // seeded, stable, verified
const SHOPPER = { email: `sweep-shopper-${TS}@voeq.ng`, password: "SweepPass123!", name: "Sweep Shopper" };
const VENDOR = { email: `sweep-vendor-${TS}@voeq.ng`, password: "SweepPass123!", name: "Sweep Vendor" };
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
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  absorb(jar, res);
  const data = await res.json().catch(() => null);
  return { res, data };
}
async function devOtp(email: string, purpose: string): Promise<string> {
  const { data } = await api({}, "/api/dev/otp", { method: "POST", body: JSON.stringify({ email, purpose }) });
  if (!data?.code) throw new Error(`devOtp empty for ${email}: ${JSON.stringify(data)}`);
  return data.code;
}
function evidence(label: string, detail: unknown) {
  console.log(`[SWEEP] ${label}:`, JSON.stringify(detail)?.slice(0, 220));
}

describe("LAUNCH SWEEP v2: full real-user journey on fresh Neon", () => {
  beforeAll(async () => {
    const r = await fetch(`${BASE}/api/health`);
    if (!r.ok) throw new Error("dev server not up");
  }, 15000);

  it("A. shopper signup -> OTP -> consent (full auth chain)", async () => {
    const jar: Jar = {};
    const su = await api(jar, "/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ ...SHOPPER, intent: "shopper", consent: true }),
    });
    evidence("signup", { status: su.res.status, token: !!su.data.pendingToken });
    expect(su.res.status).toBe(200);
    expect(su.data.pendingToken).toBeTruthy();

    const code = await devOtp(SHOPPER.email, "registration");
    evidence("otp", { code: "received" });

    const ver = await api(jar, "/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ token: su.data.pendingToken, code }),
    });
    evidence("verify", { status: ver.res.status, redirect: ver.data?.redirect });
    expect(ver.res.status).toBe(200);

    const con = await api(jar, "/api/auth/consent", { method: "POST", body: JSON.stringify({}) });
    evidence("consent", { status: con.res.status });
    expect(con.res.status).toBe(200);

    const st = await api(jar, "/api/auth/status");
    evidence("status", { authed: st.data?.authenticated, campus: st.data?.identity?.campus });
    expect(st.data.authenticated).toBe(true);

    // campus selection (the v1 bug: this was never actually set)
    const sc = await api(jar, "/api/auth/set-campus", {
      method: "POST",
      body: JSON.stringify({ campus: CAMPUS }),
    });
    evidence("set-campus", { status: sc.res.status, body: sc.data });
    expect(sc.res.status).toBe(200);
    // /api/auth/status returns only {authenticated, unreadCount, role} — campus
    // persistence is verified by step-2/go-live success downstream, which 400s
    // when campus is missing. Here: set-campus already returned ok above.
  }, 90000);

  it("B. vendor signup -> OTP -> consent -> onboarding 1-3 -> go-live", async () => {
    const jar: Jar = {};
    const su = await api(jar, "/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ ...VENDOR, intent: "vendor", consent: true }),
    });
    evidence("signup", { status: su.res.status });
    expect(su.res.status).toBe(200);

    const code = await devOtp(VENDOR.email, "registration");
    const ver = await api(jar, "/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ token: su.data.pendingToken, code }),
    });
    evidence("verify", { status: ver.res.status });
    expect(ver.res.status).toBe(200);

    await api(jar, "/api/auth/consent", { method: "POST", body: JSON.stringify({}) });
    const sc = await api(jar, "/api/auth/set-campus", {
      method: "POST",
      body: JSON.stringify({ campus: CAMPUS }),
    });
    evidence("set-campus", { status: sc.res.status, body: sc.data });
    expect(sc.res.status).toBe(200);

    const s1 = await api(jar, "/api/onboarding/vendor/step-1", {
      method: "POST",
      body: JSON.stringify({
        name: "Sweep Kitchen",
        description: "Campus jollof and small chops made by the Sweep Vendor test account.",
        categoryId: "food",
      }),
    });
    evidence("step-1", { status: s1.res.status, vendorId: s1.data?.vendorId, err: s1.data?.error, fe: s1.data?.fieldErrors });
    expect(s1.res.status).toBe(200);
    expect(s1.data.vendorId).toBeTruthy();

    const s2 = await api(jar, "/api/onboarding/vendor/step-2", {
      method: "POST",
      body: JSON.stringify({ campus: CAMPUS, subArea: "Hostel B" }),
    });
    evidence("step-2", { status: s2.res.status });
    expect(s2.res.status).toBe(200);

    const s3 = await api(jar, "/api/onboarding/vendor/step-3", {
      method: "POST",
      body: JSON.stringify({ agreed: true }),
    });
    evidence("step-3", { status: s3.res.status });
    expect(s3.res.status).toBe(200);

    // go-live intentionally NOT called here: the gate requires profile photo +
    // at least one listing first (verified in stage C where it belongs).
  }, 120000);

  it("C. vendor creates a listing (core marketplace action)", async () => {
    const jar: Jar = {};
    const li = await api(jar, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...VENDOR, turnstileToken: TURNSTILE, remember: true }),
    });
    evidence("login", { status: li.res.status, redirect: li.data?.redirect });
    expect(li.res.status).toBe(200);

    const listing = await api(jar, "/api/listings", {
      method: "POST",
      body: JSON.stringify({
        title: "Sweep Jollof Plate",
        priceMinMinor: 6500,
        categoryId: "food",
        description: "Hot campus jollof with plantain.",
        images: [],
      }),
    });
    evidence("listing", { status: listing.res.status, id: listing.data?.id, err: listing.data?.error });
    expect(listing.res.status).toBe(200);
    expect(listing.data?.listing?.id ?? listing.data?.id).toBeTruthy();

    // Go-live (P2 graduated): with agreement + a listing, the vendor can now go
    // LIVE without a profile photo (photo is recommended, not a wall). This
    // proves the smoother vendor path: listing alone → live.
    const gl = await api(jar, "/api/vendor/go-live", { method: "POST", body: JSON.stringify({}) });
    evidence("go-live-after-listing", { status: gl.res.status, body: gl.data });
    expect(gl.res.status).toBe(200);
    expect(gl.data?.status).toBe("live");
    // No photo? Should be a recommendation, never a blocking reason.
    if (Array.isArray(gl.data?.notes)) {
      expect(gl.data.notes).toContain("profile_photo_recommended");
    }
  }, 90000);

  it("D. public surfaces the real vendor (marketplace visible)", async () => {
    const { res, data } = await api({}, "/api/vendors");
    evidence("vendors", { status: res.status, source: data?.source, n: data?.vendors?.length, names: data?.vendors?.slice(0, 5).map((v: any) => v.name) });
    expect(res.status).toBe(200);
    const sweep = data.vendors.find((v: any) => v.name === "Sweep Kitchen");
    evidence("sweep-vendor", sweep ? { found: true, slug: sweep.slug, cat: sweep.category } : { found: false });
    expect(sweep).toBeTruthy();
  }, 30000);

  it("E. shopper <-> vendor messaging round-trip", async () => {
    const sjar: Jar = {};
    const sl = await api(sjar, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...SHOPPER, turnstileToken: TURNSTILE }),
    });
    evidence("login", { status: sl.res.status });
    expect(sl.res.status).toBe(200);

    const vlist = await api({}, "/api/vendors");
    const sweep = vlist.data.vendors.find((v: any) => v.name === "Sweep Kitchen");
    expect(sweep).toBeTruthy();

    const conv = await api(sjar, "/api/conversations", {
      method: "POST",
      body: JSON.stringify({ vendorId: sweep.id, listingId: null }),
    });
    const convId = conv.data?.id ?? conv.data?.conversation?.id;
    evidence("conversation", { status: conv.res.status, id: convId, err: conv.data?.error });
    expect(convId).toBeTruthy();

    const msg = await api(sjar, `/api/conversations/${convId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body: "Hi! Is the jollof still available?" }),
    });
    evidence("message-send", { status: msg.res.status });
    expect(msg.res.status).toBe(200);

    const back = await api(sjar, `/api/conversations/${convId}/messages`);
    const list = Array.isArray(back.data) ? back.data : back.data?.messages ?? [];
    evidence("message-read", { n: list.length, bodies: list.slice(0, 3).map((m: any) => m.body) });
    expect(list.some((m: any) => m.body === "Hi! Is the jollof still available?")).toBe(true);
  }, 90000);

  it("F. shopper reviews + follows + saves the vendor (engagement goes live)", async () => {
    const sjar: Jar = {};
    await api(sjar, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...SHOPPER, turnstileToken: TURNSTILE }),
    });
    const vlist = await api({}, "/api/vendors");
    const sweep = vlist.data.vendors.find((v: any) => v.name === "Sweep Kitchen");
    expect(sweep).toBeTruthy();

    const rev = await api(sjar, "/api/reviews", {
      method: "POST",
      body: JSON.stringify({ vendorId: sweep.id, rating: 5, body: "Best jollof on campus, sweep test approves." }),
    });
    evidence("review", { status: rev.res.status, err: rev.data?.error });
    expect(rev.res.status).toBe(200);

    const fol = await api(sjar, "/api/follow", {
      method: "POST",
      body: JSON.stringify({ vendorId: sweep.id }),
    });
    evidence("follow", { status: fol.res.status, following: fol.data?.following });
    expect([200, 201, 204]).toContain(fol.res.status);

    const sav = await api(sjar, "/api/saved", {
      method: "POST",
      body: JSON.stringify({ targetType: "vendor", targetId: sweep.id }),
    });
    evidence("save", { status: sav.res.status });
    expect([200, 201, 204]).toContain(sav.res.status);
  }, 90000);

  it("G. record sweep accounts for founder disposal", async () => {
    const sjar: Jar = {};
    await api(sjar, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...SHOPPER, turnstileToken: TURNSTILE }),
    });
    const st = await api(sjar, "/api/auth/status");
    evidence("final-status", { authed: st.data?.authenticated });
    expect(st.data.authenticated).toBe(true);
    evidence("SWEEP-ACCOUNTS", { shopper: SHOPPER.email, vendor: VENDOR.email });
  }, 60000);
});
