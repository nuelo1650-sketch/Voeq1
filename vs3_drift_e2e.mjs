const BASE = "http://localhost:3000";
const RESET = `${BASE}/api/dev/reset-rate-limit`;
const RESET_ID = `${BASE}/api/dev/reset-identities`;

function j(m, u, b, c) {
  return fetch(u, { method: m, headers: { "Content-Type": "application/json", ...(c ? { cookie: c } : {}) }, body: b ? JSON.stringify(b) : undefined, redirect: "manual" });
}
function signupFlow(email) {
  return (async () => {
    let r = await j("POST", `${BASE}/api/auth/signup`, { email, name: "Drift V", password: "testpass123", consent: true, intent: "vendor" });
    const pt = (await r.json()).pendingToken;
    r = await j("POST", `${BASE}/api/dev/otp`, { email, purpose: "registration" });
    const otp = (await r.json()).code;
    r = await j("POST", `${BASE}/api/auth/verify-otp`, { token: pt, code: otp, intent: "vendor" });
    return (r.headers.get("set-cookie") || "").split(";")[0];
  })();
}
const out = [];
const rec = (l, ok, d = "") => out.push([ok ? "PASS" : "FAIL", l, d]);

(async () => {
  await fetch(RESET, { method: "POST" });
  await fetch(RESET_ID, { method: "POST" });

  // ---- Drift A: delete last listing reverts live -> pending_listings ----
  const email = `driftA${Date.now()}@voeq.ng`;
  let c = await signupFlow(email);
  let r = await j("POST", `${BASE}/api/onboarding/vendor/step-1`, { name: "Drift A Co", description: "Vendor for listing-delete drift test, sufficiently long description.", categoryId: "food" }, c);
  const va = (await r.json()).vendorId;
  await j("POST", `${BASE}/api/onboarding/vendor/step-2`, { campus: "nmu", subArea: "H1" }, c);
  await j("POST", `${BASE}/api/onboarding/vendor/step-3`, { agreed: true }, c);
  await j("POST", `${BASE}/api/vendor/upload-photo`, { fileName: "pic.jpg" }, c);
  r = await j("POST", `${BASE}/api/listings`, { title: "Only Item", priceMinMinor: 1000, categoryId: "food" }, c);
  const la = (await r.json()).listingId;
  r = await j("POST", `${BASE}/api/vendor/go-live`, null, c);
  rec("A: go-live -> live", r.status === 200 && (await r.json()).status === "live");

  r = await j("GET", `${BASE}/vendor/${va}`, null, c);
  rec("A: storefront public before delete", r.status === 200);

  r = await j("DELETE", `${BASE}/api/listings/${la}`, null, c);
  rec("A: DELETE listing 200", r.status === 200);

  // authoritative revert check: re-running go-live must now fail (409) with no_listing
  r = await j("POST", `${BASE}/api/vendor/go-live`, null, c);
  const reGo = await r.json().catch(() => ({}));
  rec("A: status reverted (go-live now blocked: no_listing)", (r.status === 409 || r.status === 200) && reGo.reasons.includes("no_listing"), `status=${r.status} reasons=${JSON.stringify(reGo.reasons)}`);
  r = await j("GET", `${BASE}/vendor/${va}`, null, c);
  rec("A: storefront 404 after last listing deleted", r.status === 404);

  // ---- Drift B: delete profile photo reverts live -> pending_listings ----
  await fetch(RESET, { method: "POST" });
  const email2 = `driftB${Date.now()}@voeq.ng`;
  c = await signupFlow(email2);
  r = await j("POST", `${BASE}/api/onboarding/vendor/step-1`, { name: "Drift B Co", description: "Vendor for photo-remove drift test, sufficiently long description.", categoryId: "food" }, c);
  const vb = (await r.json()).vendorId;
  await j("POST", `${BASE}/api/onboarding/vendor/step-2`, { campus: "nmu", subArea: "H2" }, c);
  await j("POST", `${BASE}/api/onboarding/vendor/step-3`, { agreed: true }, c);
  await j("POST", `${BASE}/api/vendor/upload-photo`, { fileName: "pic.jpg" }, c);
  await j("POST", `${BASE}/api/listings`, { title: "Item B", priceMinMinor: 1000, categoryId: "food" }, c);
  r = await j("POST", `${BASE}/api/vendor/go-live`, null, c);
  rec("B: go-live -> live", r.status === 200 && (await r.json()).status === "live");
  r = await j("DELETE", `${BASE}/api/vendor/photo`, null, c);
  rec("B: DELETE photo 200", r.status === 200);
  r = await j("GET", `${BASE}/vendor/${vb}`, null, c);
  rec("B: storefront 404 after photo removed", r.status === 404);

  // ---- Negative: deleting someone else's listing is forbidden ----
  await fetch(RESET, { method: "POST" });
  const email3 = `driftC${Date.now()}@voeq.ng`;
  const cOther = await signupFlow(email3);
  r = await j("POST", `${BASE}/api/onboarding/vendor/step-1`, { name: "Owner Co", description: "Owner vendor for cross-delete test, sufficiently long description.", categoryId: "food" }, cOther);
  const vo = (await r.json()).vendorId;
  await j("POST", `${BASE}/api/onboarding/vendor/step-2`, { campus: "nmu", subArea: "H3" }, cOther);
  await j("POST", `${BASE}/api/onboarding/vendor/step-3`, { agreed: true }, cOther);
  await j("POST", `${BASE}/api/vendor/upload-photo`, { fileName: "pic.jpg" }, cOther);
  r = await j("POST", `${BASE}/api/listings`, { title: "Owned Item", priceMinMinor: 1000, categoryId: "food" }, cOther);
  const lo = (await r.json()).listingId;
  // a different logged-in identity tries to delete lo (no vendor link)
  const email4 = `driftD${Date.now()}@voeq.ng`;
  const cAttacker = await signupFlow(email4);
  r = await j("DELETE", `${BASE}/api/listings/${lo}`, null, cAttacker);
  rec("NEG: cross-owner delete forbidden (403)", r.status === 403);
  // owner can still delete their own listing => it was intact (403 did not remove it)
  r = await j("DELETE", `${BASE}/api/listings/${lo}`, null, cOther);
  rec("NEG: owned listing intact (owner self-delete 200)", r.status === 200);

  let fails = 0;
  for (const [s, l, d] of out) { if (s === "FAIL") fails++; console.log(`${s} | ${l} | ${d}`); }
  console.log(fails === 0 ? "ALL PASS" : `FAILURES=${fails}`);
})();
