const BASE = "http://localhost:3000";
const RESET = `${BASE}/api/dev/reset-rate-limit`;
const RESET_ID = `${BASE}/api/dev/reset-identities`;
function j(method, url, body, cookie) {
  return fetch(url, { method, headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined, redirect: "manual" });
}
const out = [];
const rec = (n, c, e = "") => out.push([c ? "PASS" : "FAIL", n, e]);
(async () => {
  await j("POST", RESET); await j("POST", RESET_ID);
  const email = `vs3shop${Date.now()}@voeq.ng`;
  let r = await j("POST", `${BASE}/api/auth/signup`, { email, name: "Shopper Test", password: "testpass123", consent: true, intent: "shopper" });
  rec("signup 200", r.status === 200);
  const sb = await r.json().catch(() => ({}));
  const token = sb.pendingToken;
  rec("signup returns pendingToken", !!token);
  r = await j("POST", `${BASE}/api/dev/otp`, { email, purpose: "registration" });
  const otp = (await r.json()).code;
  rec("otp peek", !!otp, `otp=${otp}`);
  r = await j("POST", `${BASE}/api/auth/verify-otp`, { token, code: otp, intent: "shopper" });
  const setC = r.headers.get("set-cookie") || "";
  const vbody = await r.json().catch(() => ({}));
  rec("verify-otp 200 + cookie + /consent", r.status === 200 && setC.includes("sessionId") && (vbody.redirect || "").includes("/consent"));
  const cookie = setC.split(";")[0];
  if (!cookie) { console.log("NO COOKIE"); console.log(JSON.stringify(out)); return; }
  r = await j("POST", `${BASE}/api/auth/consent`, null, cookie);
  const cbody = await r.json().catch(() => ({}));
  rec("consent POST 200 + /select-campus", r.status === 200 && (cbody.redirect || "").includes("/select-campus"));
  r = await j("POST", `${BASE}/api/auth/set-campus`, { campus: "nmu" }, cookie);
  const scbody = await r.json().catch(() => ({}));
  rec("set-campus 200 + /onboarding/shopper", r.status === 200 && (scbody.redirect || "").includes("/onboarding/shopper"));
  r = await j("GET", `${BASE}/onboarding/shopper`, null, cookie);
  rec("GET /onboarding/shopper 200", r.status === 200);
  r = await j("POST", `${BASE}/api/onboarding/shopper/complete`, { interestTags: ["food", "tech"] }, cookie);
  const shbody = await r.json().catch(() => ({}));
  rec("shopper complete 200 + /home", r.status === 200 && (shbody.redirect || "").includes("/home"));
  r = await j("GET", `${BASE}/home`, null, cookie);
  rec("GET /home 200 (gate passed)", r.status === 200);
  r = await j("GET", `${BASE}/home`);
  rec("GET /home unauth -> /login", r.status === 307 && (r.headers.get("location") || "").includes("/login"));
  console.log(JSON.stringify(out));
  const f = out.filter((x) => x[0] === "FAIL");
  console.log(`\n${f.length === 0 ? "VS3.1 ALL PASS" : "FAILURES: " + f.length}`);
})();
