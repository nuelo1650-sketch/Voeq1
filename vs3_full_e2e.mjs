const BASE = "http://localhost:3000";
const RESET = `${BASE}/api/dev/reset-rate-limit`;
const RESET_ID = `${BASE}/api/dev/reset-identities`;

function j(method, url, body, cookie) {
  return fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
}
const out = [];
const rec = (label, ok, detail = "") => out.push([ok ? "PASS" : "FAIL", label, detail]);

(async () => {
  await fetch(RESET, { method: "POST" }).catch(() => {});
  await fetch(RESET_ID, { method: "POST" }).catch(() => {});

  // 1. signup (vendor intent)
  const email = `vs3full${Date.now()}@voeq.ng`;
  let r = await j("POST", `${BASE}/api/auth/signup`, {
    email, name: "Full Flow Vendor", password: "testpass123", consent: true, intent: "vendor",
  });
  const signupBody = await r.json().catch(() => ({}));
  const pendingToken = signupBody.pendingToken;
  rec("signup 200 + pendingToken", r.status === 200 && !!pendingToken, `status=${r.status}`);

  // 2. peek OTP
  r = await j("POST", `${BASE}/api/dev/otp`, { email, purpose: "registration" });
  const otp = (await r.json().catch(() => ({}))).code;
  rec("otp peek", !!otp, `otp=${otp}`);

  // 3. verify-otp -> session
  r = await j("POST", `${BASE}/api/auth/verify-otp`, { token: pendingToken, code: otp, intent: "vendor" });
  const setC = r.headers.get("set-cookie") || "";
  const cookie = setC.split(";")[0];
  rec("verify-otp 200 + cookie", r.status === 200 && setC.includes("sessionId"), `status=${r.status}`);
  if (!cookie) { return report(); }

  // 4. Phase A step-1
  r = await j("POST", `${BASE}/api/onboarding/vendor/step-1`, {
    name: "Campus Eats Co", description: "Hot meals and snacks delivered to your hostel daily, freshly made.", categoryId: "food",
  }, cookie);
  const s1 = await r.json().catch(() => ({}));
  rec("Phase A step-1 (pending_listings)", r.status === 200 && s1.vendorId && s1.nextStep === 2, `vendorId=${s1.vendorId}`);

  // 5. Phase A step-2
  r = await j("POST", `${BASE}/api/onboarding/vendor/step-2`, { campus: "nmu", subArea: "Hall 2" }, cookie);
  const s2 = await r.json().catch(() => ({}));
  rec("Phase A step-2", r.status === 200 && s2.nextStep === 3, `next=${s2.nextStep}`);

  // 6. Phase A step-3 (agreement)
  r = await j("POST", `${BASE}/api/onboarding/vendor/step-3`, { agreed: true }, cookie);
  const s3 = await r.json().catch(() => ({}));
  rec("Phase A step-3 complete", r.status === 200 && s3.nextStep === "complete" && s3.status === "pending_listings", `status=${s3.status}`);

  // 7. dashboard shows pending + 0 listings + not live
  r = await j("GET", `${BASE}/vendor/dashboard`, null, cookie);
  let html = await r.text().catch(() => "");
  rec("dashboard: pending, not live, 0 listings", r.status === 200 && html.includes("not yet public") && html.includes("No listings yet"), `status=${r.status}`);

  // 8. Cloudinary REJECT path
  r = await j("POST", `${BASE}/api/vendor/upload-photo`, { fileName: "reject-this.png" }, cookie);
  rec("photo upload rejected (moderation)", r.status === 422, `status=${r.status}`);
  // still no photo
  r = await j("GET", `${BASE}/vendor/dashboard`, null, cookie);
  html = await r.text().catch(() => "");
  rec("dashboard still no photo after reject", r.status === 200 && !html.includes("vendor-photo"), `hasPhoto=${html.includes("vendor-photo")}`);

  // 9. Cloudinary APPROVED path
  r = await j("POST", `${BASE}/api/vendor/upload-photo`, { fileName: "mama.jpg" }, cookie);
  const up = await r.json().catch(() => ({}));
  rec("photo upload approved", r.status === 200 && !!up.profilePhotoUrl, `url=${up.profilePhotoUrl}`);

  // 10. create first listing
  r = await j("POST", `${BASE}/api/listings`, {
    title: "Jollof Lunch Pack", priceMinMinor: 3500, categoryId: "food", description: "Rice, stew, plantain.",
  }, cookie);
  const lst = await r.json().catch(() => ({}));
  rec("listing created", r.status === 200 && !!lst.listingId, `listingId=${lst.listingId}`);

  // 11. go-live (now preconditions met)
  r = await j("POST", `${BASE}/api/vendor/go-live`, null, cookie);
  const gl = await r.json().catch(() => ({}));
  rec("go-live success", r.status === 200 && gl.status === "live", `status=${gl.status}`);

  // 12. storefront now publicly reachable (need vendor id)
  const vendorId = s1.vendorId;
  r = await j("GET", `${BASE}/vendor/${vendorId}`, null, cookie);
  rec("storefront public (200) after go-live", r.status === 200, `status=${r.status}`);

  // 13. upgrade path: identity role widened to vendor (verify via /settings showing vendor)
  r = await j("GET", `${BASE}/settings`, null, cookie);
  const setHtml = await r.text().catch(() => "");
  rec("upgrade: settings shows vendor role", r.status === 200 && setHtml.replace(/<!--.*?-->/g, "").includes("Role: vendor"), `roleShown=${setHtml.replace(/<!--.*?-->/g, "").includes("Role: vendor")}`);

  // 14. VISIBILITY GATE: a brand-new vendor that did NOT go live must 404 on storefront
  await fetch(RESET_ID, { method: "POST" }).catch(() => {});
  const email2 = `vs3gate${Date.now()}@voeq.ng`;
  r = await j("POST", `${BASE}/api/auth/signup`, { email: email2, name: "Gated Vendor", password: "testpass123", consent: true, intent: "vendor" });
  const pt = (await r.json().catch(() => ({}))).pendingToken;
  r = await j("POST", `${BASE}/api/dev/otp`, { email: email2, purpose: "registration" });
  const otp2 = (await r.json().catch(() => ({}))).code;
  r = await j("POST", `${BASE}/api/auth/verify-otp`, { token: pt, code: otp2, intent: "vendor" });
  const c2 = (r.headers.get("set-cookie") || "").split(";")[0];
  r = await j("POST", `${BASE}/api/onboarding/vendor/step-1`, { name: "Gated Co", description: "A business that will not complete Phase B, on purpose for the gate test.", categoryId: "food" }, c2);
  const gv = await r.json().catch(() => ({}));
  r = await j("POST", `${BASE}/api/onboarding/vendor/step-2`, { campus: "nmu", subArea: "Hall 9" }, c2);
  r = await j("POST", `${BASE}/api/onboarding/vendor/step-3`, { agreed: true }, c2);
  // vendor exists, status pending_listings, NOT public -> storefront 404
  r = await j("GET", `${BASE}/vendor/${gv.vendorId}`, null, c2);
  rec("visibility gate: pending vendor 404 (no isPublic flag)", r.status === 404, `status=${r.status}`);

  report();
})();

function report() {
  let fails = 0;
  for (const [s, l, d] of out) { if (s === "FAIL") fails++; console.log(`${s} | ${l} | ${d}`); }
  console.log(fails === 0 ? "ALL PASS" : `FAILURES=${fails}`);
}
