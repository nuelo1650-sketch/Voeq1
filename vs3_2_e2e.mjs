const BASE = "http://localhost:3000";
const RESET = `${BASE}/api/dev/reset-rate-limit`;
const RESET_ID = `${BASE}/api/dev/reset-identities`;

function j(method, url, body, cookie) {
  return fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
}

const out = [];
function rec(label, ok, detail = "") {
  out.push([ok ? "PASS" : "FAIL", label, detail]);
}

(async () => {
  await fetch(RESET, { method: "POST" }).catch(() => {});
  await fetch(RESET_ID, { method: "POST" }).catch(() => {});

  // 1. signup (shopper intent; vendor onboarding is open to any signed-up user)
  const email = `vs3vend${Date.now()}@voeq.ng`;
  let r = await j("POST", `${BASE}/api/auth/signup`, {
    email, name: "Vendor Tester", password: "testpass123", consent: true, intent: "vendor",
  });
  const signupBody = await r.json().catch(() => ({}));
  const pendingToken = signupBody.pendingToken;
  rec("signup 200 + pendingToken", r.status === 200 && !!pendingToken, `status=${r.status} token=${!!pendingToken}`);

  // 2. peek OTP
  r = await j("POST", `${BASE}/api/dev/otp`, { email, purpose: "registration" });
  const otp = (await r.json().catch(() => ({}))).code;
  rec("otp peek", !!otp, `otp=${otp}`);

  // 3. verify-otp -> session cookie
  r = await j("POST", `${BASE}/api/auth/verify-otp`, {
    token: pendingToken, code: otp, intent: "vendor",
  });
  const setC = r.headers.get("set-cookie") || "";
  const sb = await r.json().catch(() => ({}));
  const cookie = setC.split(";")[0];
  rec("verify-otp 200 + cookie", r.status === 200 && setC.includes("sessionId"), `status=${r.status} cookie=${!!cookie}`);

  if (!cookie) { report(); return; }

  // 4. step-1: business identity
  r = await j("POST", `${BASE}/api/onboarding/vendor/step-1`, {
    name: "Campus Bites", description: "Fresh meals and snacks delivered right across the hall, daily.", categoryId: "food",
  }, cookie);
  const s1 = await r.json().catch(() => ({}));
  rec("step-1 creates vendor (pending_listings)", r.status === 200 && s1.vendorId && s1.nextStep === 2, `status=${r.status} vendorId=${s1.vendorId} next=${s1.nextStep}`);

  // 5. step-2: campus + sub-area
  r = await j("POST", `${BASE}/api/onboarding/vendor/step-2`, {
    campus: "nmu", subArea: "Hall 4",
  }, cookie);
  const s2 = await r.json().catch(() => ({}));
  rec("step-2 sets campus", r.status === 200 && s2.nextStep === 3, `status=${r.status} next=${s2.nextStep}`);

  // 6. step-3: agreement
  r = await j("POST", `${BASE}/api/onboarding/vendor/step-3`, {
    agreed: true,
  }, cookie);
  const s3 = await r.json().catch(() => ({}));
  rec("step-3 completes Phase A", r.status === 200 && s3.nextStep === "complete" && s3.status === "pending_listings", `status=${r.status} next=${s3.nextStep} status=${s3.status}`);

  // 7. vendor dashboard reachable with this session and shows pending (not live)
  r = await j("GET", `${BASE}/vendor/dashboard`, null, cookie);
  const dashHtml = await r.text().catch(() => "");
  rec("vendor/dashboard renders pending status", r.status === 200 && dashHtml.includes("not yet public"), `status=${r.status} hasPending=${dashHtml.includes("not yet public")}`);

  report();
})();

function report() {
  let fails = 0;
  for (const [s, l, d] of out) { if (s === "FAIL") fails++; console.log(`${s} | ${l} | ${d}`); }
  console.log(fails === 0 ? "ALL PASS" : `FAILURES=${fails}`);
}
