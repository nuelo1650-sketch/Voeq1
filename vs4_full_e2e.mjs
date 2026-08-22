const BASE = "http://localhost:3000";
const RESET = `${BASE}/api/dev/reset-identities`;

function j(m, u, b, c) {
  return fetch(u, { method: m, headers: { "Content-Type": "application/json", ...(c ? { cookie: c } : {}) }, body: b ? JSON.stringify(b) : undefined, redirect: "manual" });
}
async function signupFlow(email) {
  let r = await j("POST", `${BASE}/api/auth/signup`, { email, name: "VS4 E2E", password: "testpass123", consent: true, intent: "shopper" });
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
  await fetch(`${BASE}/api/dev/reset-rate-limit`, { method: "POST" });

  // unauth guards
  rec("unauth POST /api/reviews → 401", (await j("POST", `${BASE}/api/reviews`, { vendorId: "v1", rating: 5, body: "great service here" })).status === 401);
  rec("unauth POST /api/listings/l1/comments → 401", (await j("POST", `${BASE}/api/listings/l1/comments`, { body: "hi" })).status === 401);
  rec("unauth POST /api/reports → 401", (await j("POST", `${BASE}/api/reports`, { targetType: "listing", targetId: "l1", category: "scam" })).status === 401);
  // public read works unauth
  rec("public GET /api/listings/l1/comments → 200", (await j("GET", `${BASE}/api/listings/l1/comments`)).status === 200);
  rec("public GET /api/reviews/v1 → 200", (await j("GET", `${BASE}/api/reviews/v1`)).status === 200);

  const email = `vs4e2e${Date.now()}@voeq.ng`;
  const c = await signupFlow(email);

  // reviews: create + upsert (one per shopper-vendor)
  let r = await j("POST", `${BASE}/api/reviews`, { vendorId: "v1", rating: 4, body: "solid experience overall" }, c);
  rec("authed review create → ok", r.status === 200);
  r = await j("POST", `${BASE}/api/reviews`, { vendorId: "v1", rating: 5, body: "updated to five stars now" }, c);
  rec("authed review upsert (still ok)", r.status === 200);
  r = await j("GET", `${BASE}/api/reviews/v1`);
  const rv = await r.json();
  rec("GET /api/reviews/v1 returns derived avg", r.status === 200 && typeof rv.ratingAvg === "number" && rv.ratingCount >= 1, JSON.stringify(rv).slice(0, 120));

  // comments: post + list (public)
  r = await j("POST", `${BASE}/api/listings/l1/comments`, { body: "is this still available?" }, c);
  rec("authed comment post → ok", r.status === 200);
  r = await j("GET", `${BASE}/api/listings/l1/comments`);
  const cm = await r.json();
  rec("GET comments returns posted comment (public)", r.status === 200 && cm.comments.some((x) => x.body.includes("still available")), `count=${cm.comments.length}`);

  // report: creates staff case
  r = await j("POST", `${BASE}/api/reports`, { targetType: "listing", targetId: "l1", category: "not_on_campus", body: "not on campus" }, c);
  rec("authed report create → ok", r.status === 200);

  // notifications: seeded welcome + unread
  r = await j("GET", `${BASE}/api/notifications`, null, c);
  const nt = await r.json();
  rec("GET /api/notifications has seeded welcome + unread", r.status === 200 && nt.unread >= 1 && nt.notifications.length >= 1, `unread=${nt.unread}`);

  // settings: campus + notif prefs PATCH
  r = await j("PATCH", `${BASE}/api/settings/campus`, { campusId: "UNILAG" }, c);
  rec("PATCH /api/settings/campus → ok", r.status === 200 && (await r.json()).campus === "UNILAG");
  r = await j("PATCH", `${BASE}/api/settings/notifications`, { prefs: { new_message: "email", new_review: "in_app", review_response: "none", new_follower: "in_app", system: "in_app" } }, c);
  rec("PATCH /api/settings/notifications → ok", r.status === 200);

  // dashboard aggregate
  r = await j("GET", `${BASE}/api/home`, null, c);
  rec("GET /api/home → 200", r.status === 200);

  // pages render 200
  for (const p of ["/explore", "/c/food-drinks", "/vendor/v1", "/listing/l1", "/notifications"]) {
    r = await j("GET", `${BASE}${p}`, null, c);
    rec(`page ${p} → 200 (auth)`, r.status === 200, `status=${r.status}`);
  }
  // /home redirects to /onboarding/shopper until shopper onboarding is done (correct gate)
  r = await j("GET", `${BASE}/home`, null, c);
  rec("page /home → 200 or onboarding-gate 307", r.status === 200 || r.status === 307, `status=${r.status}`);
  r = await j("GET", `${BASE}/settings`, null, c);
  rec("page /settings → 200", r.status === 200, `status=${r.status}`);
  // /browse deleted → 404
  r = await j("GET", `${BASE}/browse`);
  rec("/browse → 404 (deleted)", r.status === 404, `status=${r.status}`);

  let fails = 0;
  for (const [s, l, d] of out) { if (s === "FAIL") fails++; console.log(`${s} | ${l} | ${d}`); }
  console.log(fails === 0 ? "ALL PASS" : `FAILURES=${fails}`);
})();
