/**
 * Staff batch 2 / T5 — NDPR subject export HTTP round-trip (test DB server).
 * Skipped unless VOEQ_HTTP_BASE is set (batch-1 protocol):
 *   DATABASE_URL=<test> TURNSTILE_SECRET_KEY= *** next dev -p 3031
 *   VOEQ_HTTP_BASE=http://localhost:3031 npx vitest run tests/staff-batch2-export-http.test.ts
 *
 * Acceptance from the scope doc: round-trip returns the caller's rows and
 * EXCLUDES another user's private data — specifically the counterparty's
 * message bodies inside a shared conversation must be absent.
 */
import { describe, it, expect } from "vitest";

const BASE = process.env.VOEQ_HTTP_BASE ?? "";
const runHttp = Boolean(process.env.VOEQ_HTTP_BASE);
const TS = Date.now();

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

describe.skipIf(!runHttp)("staff batch 2 — export-data HTTP round-trip", () => {
  const shopperJar: Jar = {};
  const vendorJar: Jar = {};
  let convId = "";
  const secretA = `r83-shopper-secret-${TS}`;
  const secretB = `r83-vendor-secret-${TS}`;

  it("anon export is 401", async () => {
    const { res } = await api({}, "/api/settings/export-data");
    expect(res.status).toBe(401);
  });

  it("sign-in both parties and open a conversation", async () => {
    const sh = await api(shopperJar, "/api/dev/shopper-session", { method: "POST", body: "{}" });
    expect(sh.res.status).toBe(200);
    const ve = await api(vendorJar, "/api/dev/vendor-session", { method: "POST", body: JSON.stringify({ vendorId: "v1" }) });
    expect(ve.res.status).toBe(200);
    const conv = await api(shopperJar, "/api/conversations", {
      method: "POST",
      body: JSON.stringify({ vendorId: "v1" }),
    });
    expect(conv.res.status).toBe(200);
    convId = conv.data.conversation.id;
    expect(convId).toBeTruthy();
  });

  it("each side sends a message", async () => {
    const a = await api(shopperJar, `/api/conversations/${convId}/messages`, {
      method: "POST", body: JSON.stringify({ body: `hello from shopper ${secretA}` }),
    });
    expect(a.res.status).toBe(200);
    const b = await api(vendorJar, `/api/conversations/${convId}/messages`, {
      method: "POST", body: JSON.stringify({ body: `reply from vendor ${secretB}` }),
    });
    expect(b.res.status).toBe(200);
  });

  it("shopper export contains own message, NOT the vendor's, and no passwordHash", async () => {
    const res = await fetch(`${BASE}/api/settings/export-data`, { headers: { Cookie: cookieHeader(shopperJar) } });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toContain("attachment");
    const text = await res.text();
    expect(text).toContain(secretA);
    expect(text).not.toContain(secretB);
    expect(text).not.toContain("passwordHash");
    const bundle = JSON.parse(text);
    expect(bundle.subject).toBeTruthy();
    expect(Array.isArray(bundle.messages)).toBe(true);
    expect(bundle.messages.every((m: { senderId: string }) => m.senderId === bundle.identity.id)).toBe(true);
  });

  it("vendor export is the mirror image (own reply in, shopper body out)", async () => {
    const res = await fetch(`${BASE}/api/settings/export-data`, { headers: { Cookie: cookieHeader(vendorJar) } });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain(secretB);
    expect(text).not.toContain(secretA);
  });
});
