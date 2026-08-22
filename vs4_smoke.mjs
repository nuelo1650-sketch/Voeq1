const BASE = "http://localhost:3000";
const RESET = `${BASE}/api/dev/reset-rate-limit`;
const RESET_ID = `${BASE}/api/dev/reset-identities`;

function j(m, u, b, c) {
  return fetch(u, { method: m, headers: { "Content-Type": "application/json", ...(c ? { cookie: c } : {}) }, body: b ? JSON.stringify(b) : undefined, redirect: "manual" });
}
async function signupFlow(email) {
  let r = await j("POST", `${BASE}/api/auth/signup`, { email, name: "Smoke V", password: "testpass123", consent: true, intent: "shopper" });
  const pt = (await r.json()).pendingToken;
  r = await j("POST", `${BASE}/api/dev/otp`, { email, purpose: "registration" });
  const otp = (await r.json()).code;
  r = await j("POST", `${BASE}/api/auth/verify-otp`, { token: pt, code: otp, intent: "shopper" });
  return (r.headers.get("set-cookie") || "").split(";")[0];
}
const out = [];
const rec = (l, ok, d = "") => out.push([ok ? "PASS" : "FAIL", l, d]);

(async () => {
  await fetch(RESET, { method: "POST" });
  await fetch(RESET_ID, { method: "POST" });

  // unauth save → 401 (client will redirect to ?next=)
  let r = await j("POST", `${BASE}/api/saved`, { targetType: "listing", targetId: "l1" });
  rec("unauth POST /api/saved → 401", r.status === 401);

  // unauth follow → 401
  r = await j("POST", `${BASE}/api/follow`, { vendorId: "v1" });
  rec("unauth POST /api/follow → 401", r.status === 401);

  const email = `smoke${Date.now()}@voeq.ng`;
  const c = await signupFlow(email);

  // save a listing
  r = await j("POST", `${BASE}/api/saved`, { targetType: "listing", targetId: "l1" }, c);
  rec("authed save listing → saved:true", r.status === 200 && (await r.json()).saved === true);
  // toggle off
  r = await j("POST", `${BASE}/api/saved`, { targetType: "listing", targetId: "l1" }, c);
  rec("authed save toggle off → saved:false", r.status === 200 && (await r.json()).saved === false);
  // save again + list
  await j("POST", `${BASE}/api/saved`, { targetType: "listing", targetId: "l1" }, c);
  await j("POST", `${BASE}/api/saved`, { targetType: "vendor", targetId: "v1" }, c);
  r = await j("GET", `${BASE}/api/saved/list`, null, c);
  const list = await r.json();
  rec("GET /api/saved/list returns both", r.status === 200 && list.savedListings.includes("l1") && list.savedVendors.includes("v1"), JSON.stringify(list));

  // follow v1
  r = await j("POST", `${BASE}/api/follow`, { vendorId: "v1" }, c);
  rec("authed follow v1 → following:true", r.status === 200 && (await r.json()).following === true);
  r = await j("GET", `${BASE}/api/follow/list`, null, c);
  rec("GET /api/follow/list includes v1", r.status === 200 && (await r.json()).following.includes("v1"));

  // pages render 200
  for (const p of ["/explore", "/vendor/v1", "/listing/l1"]) {
    r = await j("GET", `${BASE}${p}`);
    rec(`page ${p} → 200`, r.status === 200, `status=${r.status}`);
  }

  let fails = 0;
  for (const [s, l, d] of out) { if (s === "FAIL") fails++; console.log(`${s} | ${l} | ${d}`); }
  console.log(fails === 0 ? "ALL PASS" : `FAILURES=${fails}`);
})();
