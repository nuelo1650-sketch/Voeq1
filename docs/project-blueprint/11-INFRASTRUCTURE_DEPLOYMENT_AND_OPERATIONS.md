# 11 — INFRASTRUCTURE, DEPLOYMENT & OPERATIONS

> **Status:** PLANNING / DOCUMENTATION ONLY. No code. Does **not** modify Docs 00–10. Does **not** begin
> implementation. **DO NOT PROCEED TO FINAL AUDIT — REVIEW AND LOCK DOC 11 FIRST.**
>
> **Authoritative constraints:** Docs 00–10. The mock→real data boundary (Doc 06 §1, Doc 07 §7.7/§7.21)
> is preserved — infrastructure must not force a slice reorder. OPEN mechanisms from Doc 09 are carried
> forward, not resolved.
>
> **Governing rule (founder):** Infrastructure supports the **public-first build order**; it must not force
> us to reorder slices. Distinguish **Phase 1 requirements** from things that can wait for real
> infrastructure. Mid-range Android / 60fps (Doc 05 D.7, Doc 10 §10.9) is a production-readiness
> constraint, not an afterthought.

---

## 11.1 — Environment strategy

| Env | Purpose | Data source | Notes |
|---|---|---|---|
| **Local/dev** | Slice development | `DATA_SOURCE=mock` | fastest inner loop; no real infra |
| **Preview** | Per-slice review (founder gate, Doc 10 §10.14) | mock (or api for later slices) | ephemeral per-PR |
| **Staging** | Pre-prod; real-infra trial (Phase 9) | `api` (post-slice-4) | mirrors prod config |
| **Production** | voeq.ng public | `api` | public-first surfaces live first |

- The `DATA_SOURCE` toggle (Doc 07 §7.17) means infra does **not** gate slices: public UI ships on mock,
  real backend connects per-domain in Phase 9 (Doc 06/07 §7.21) without rebuild.
- Environments differ by config + data source, **not** by a separate codebase.

---

## 11.2 — Domains & routing

- **voeq.ng** is the production domain (founder-locked). All public routes under it; deep-links shareable
  (Doc 04 §838; SEO Doc 07 §7.16).
- TLS everywhere; HSTS; modern cipher suite.
- **WWW/apex + subdomains:** only what's needed (apex + www redirect; admin/staff surfaces are routes
  under the same domain, not a separate host — keeps single-identity/session simple, Doc 07 §7.9).
- Preview deploys on branch subdomains or ephemeral URLs (🔲 exact provider pattern OPEN).

---

## 11.3 — Secrets & configuration

- Secrets server-only; never in client bundle; `NEXT_PUBLIC_*` only for non-sensitive (Doc 07 §7.17, Doc 09
  §9.20).
- Secret store = 🔲 OPEN mechanism (env vars in PaaS / secret manager in cloud). The *rule* (no client
  secrets, per-environment isolation) is LOCKED.
- Per-environment config isolation: dev/preview/staging/prod secrets never shared.
- Rotation supported (session secret, OAuth client secret) — 🔲 OPEN cadence.

---

## 11.4 — CI/CD

- **Pipeline (🔲 exact tool OPEN — GitHub Actions class assumed):** install → lint → typecheck → unit/component
  → integration → repo-contract → **per-slice gate (Doc 10 §10.13)** → build → deploy preview → E2E →
  a11y → visual regression → perf budget → founder approval → promote.
- A slice **cannot merge/progress** if its required quality gates fail (Doc 10 §10.13/§10.14).
- **Preview per PR**; production promote only after founder slice sign-off (Doc 06 §6).
- Rollback: immutable deploys + prior-artifact rollback (§11.10).

---

## 11.5 — Observability

- **Structured server logs** (Doc 09 §9.18): ID-referenced, **no PII / no secrets / no tokens**. Auth
  failures uniform (no enumeration), privilege checks, idempotency collisions.
- **Metrics** (🔲 OPEN stack): route latency, error rate, 60fps/CLS/LCP per public route (Doc 10 §10.9),
  bundle size.
- **Tracing** (🔲 OPEN): request/id correlation for incident response.
- **Alerting** (🔲 OPEN): error-rate + latency + security-event thresholds; on-call 🔲 OPEN.
- Logs/metrics never exposed to non-staff; audit logs (Doc 09 §9.18) separate, append-only.

---

## 11.6 — Storage & image handling

- **Object storage + CDN** for vendor images (Doc 07 §7.10, Doc 09 §9.15). Provider = ⏭ LATER / 🔲 OPEN
  (Doc 09). Served via CDN; client never receives upload credentials.
- **Image processing** server-side: validate type/size/dimensions, malware scan (🔲 OPEN scanner), crop to
  B.6 ratios, optional unifying overlay. Broken/missing → `ContourMonogram` (Doc 05 B.11).
- Mock phase: placeholder URLs (incl. intentionally poor images for the §10.4 storefront fixture).

---

## 11.7 — Database & migrations (real backend, Phase 9)

- Chosen in Phase 9 (Doc 08 §8.19 / Doc 07 §7.21). The **Doc 08 interfaces are the contract** — schema
  implements them; UI unaffected by the choice.
- **Migrations** (🔲 OPEN tooling): versioned, backward-compatible, no destructive lock during slice rollout.
- Deletion policy (Doc 09 §9.17): deactivation + controlled anonymization — implemented at schema +
  service layer; "Deleted account" attribution for reviews; audit/staff records retained.

---

## 11.8 — Backups & disaster recovery

- **Backups** (🔲 OPEN cadence/tool): DB + object storage; point-in-time where feasible.
- **RPO/RTO** (🔲 OPEN target): public-first means Landing/Explore data availability is priority.
- **Restore-tested** periodically (🔲 OPEN cadence). Audit records retained per Doc 09 (append-only).

---

## 11.9 — Cost controls

- Mock-first means **near-zero infra cost during public slices** (static/SSR on preview; no DB until
  Phase 9). Real backend cost begins only when slices prove the design (Doc 06 §0).
- Budgets (🔲 OPEN): compute, bandwidth (CDN), object storage, observability. Alerts on overrun.
- Avoid premature scaling infra — vertical slice validation first.

---

## 11.10 — Rollback & recovery

- **Immutable deploys**: each deploy is a versioned artifact; rollback = re-point to prior artifact.
- **Database migration safety**: forward-migrate; rollback path for non-destructive migrations; destructive
  changes gated + reviewed.
- **Incident recovery**: error states are first-class (Doc 05 C.5.4); public routes show "unavailable" not
  500 (Doc 04 PG-PUB-004, Doc 09 §9.17).
- **Session/secret compromise**: rotation path (§11.3); revoke + re-issue.

---

## 11.11 — Production readiness checklist (Phase 1)

| Capability | Phase 1? | Notes |
|---|---|---|
| Public UI deploy (Landing/Explore/Listing/Storefront) on mock | ✅ Required | portfolio + discovery |
| TLS / domain / SEO | ✅ Required | voeq.ng |
| CI with slice gates | ✅ Required | Doc 10 §10.13 |
| A11y AA + reduced-motion | ✅ Required | Doc 10 §10.8 |
| 60fps mid-Android | ✅ Required | Doc 05 D.7 |
| Observability (logs/metrics) | ✅ Required (basic) | no PII leak |
| Auth (email + Google, consent gate) | ✅ Required (Slice 5) | Doc 09 §9.3/§9.4 |
| Vendor onboarding + dashboard | ✅ Required (Slice 6) | |
| Messaging | 🟡 Phase 1 feature (Slice 7), not MVP | Doc 06 |
| Staff workbench | ✅ Required (Slice 8) | scoped Moderator |
| Real DB / Phase 9 migration | ⏭ After public proves design | Doc 06 §0/§7.21 |
| Real-time messaging transport | ⏭ LATER | Doc 07 §7.12 |
| Image CDN / scanner | ⏭ LATER (mock serves first) | §11.6 |
| Backups / DR full | ⏭ Strengthen at Phase 9 | §11.8 |

---

## 11.12 — Open / provisional decisions (carried from Doc 09, NOT resolved)

| Decision | Status |
|---|---|
| Hosting/PaaS vs cloud (Vercel/Node/etc.) | 🔲 OPEN |
| Secret manager | 🔲 OPEN |
| CI tooling | 🔲 OPEN (GitHub Actions class) |
| Observability stack (metrics/tracing/alerting) | 🔲 OPEN |
| Object storage + CDN provider | 🔲 OPEN / ⏭ LATER |
| Image malware scanner | 🔲 OPEN |
| Database engine + migration tool | 🔲 OPEN (Phase 9) |
| Backup RPO/RTO + cadence | 🔲 OPEN |
| Preview deploy pattern (subdomain/ephemeral) | 🔲 OPEN |
| Session store (DB vs signed cookie) | 🔲 OPEN |
| Rate-limit mechanism | 🔲 OPEN |
| CSRF mechanism | 🔲 OPEN |
| Verification method | 🔲 OPEN |
| Exact perf budget numbers | 🔲 OPEN (constraint LOCKED) |

None are product-policy decisions; they are mechanisms that must enforce the LOCKED behaviors in Docs 00–10.

---

## 11.13 — What Doc 11 does NOT do

- No code; infrastructure documentation only.
- Does not modify Docs 00–10.
- Does not silently resolve Doc 09 OPEN mechanisms.
- Does not reorder slices; preserves mock→real boundary.
- Does not begin implementation.
- **Does not proceed to Final Audit.**

---

**END OF DOC 11 (Infrastructure, Deployment & Operations). DO NOT PROCEED TO FINAL AUDIT — REVIEW AND LOCK DOC 11 FIRST.**
