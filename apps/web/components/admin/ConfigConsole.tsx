"use client";

/**
 * Config Console (P2, 2026-09-05) — the client control plane for /staff/config.
 * Four sections, each wired to its real config.write-gated API:
 *   Categories  → /api/staff/categories        (create, rename, activate/deactivate)
 *   Campuses    → /api/staff/campuses          (create, verify/unverify)
 *   Agreements  → /api/staff/agreements        (publish version, promote to current)
 *   Flags       → /api/staff/feature-flags     (create, toggle)
 *
 * Conventions (matches UsersPanel/ListingsPanel):
 *   - var(--role-*) tokens, 40px tap targets, inline confirm for destructive
 *     or high-blast-radius actions, errors surfaced from real API responses.
 *   - Every mutation notes the actor + timestamp result inline.
 *
 * Honest seams surfaced in the UI (not hidden):
 *   - Categories created here do NOT appear on Explore until the chips seam
 *     is wired (Explore reads the static seed array — separate batch).
 *   - Feature flags are NOT read by any runtime path yet — toggling stores
 *     state for the future; nothing enforces it today.
 */

import { useState } from "react";
import { Plus, Check, X, AlertTriangle, ChevronDown } from "lucide-react";

// ---- types -------------------------------------------------------------------

export interface CategoryRow { id: string; slug: string; name: string; color: string; icon: string; vendorCount: number; isActive?: boolean }
interface CampusRow { id: string; slug: string; name: string; city: string | null; state: string | null; status: "verified" | "unverified" }
interface AgreementRow { id: string; kind: "terms" | "privacy" | "vendor"; version: string; body: string; effectiveAt: string; isCurrent: boolean }
interface FlagRow { key: string; value: boolean; description: string }

type Section = "categories" | "campuses" | "agreements" | "flags";

// ---- shared bits ---------------------------------------------------------------

function SectionCard({ title, count, note, children }: { title: string; count: number; note?: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 8, padding: 24, marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px", color: "var(--role-text)" }}>{title} ({count})</h2>
      {note && <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--role-text-muted)", display: "flex", gap: 6, alignItems: "flex-start" }}>
        <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1, color: "var(--role-accent-strong)" }} />{note}
      </p>}
      {!note && <div style={{ height: 12 }} />}
      {children}
    </section>
  );
}

const btn = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: "10px 16px", minHeight: 40, fontSize: 14, borderRadius: 6,
  border: "1px solid var(--role-border)", background: "var(--role-surface)",
  color: "var(--role-text)", cursor: "pointer", ...extra,
});
const primaryBtn: React.CSSProperties = { ...btn(), background: "var(--role-accent-strong)", borderColor: "var(--role-accent-strong)", color: "#fff", fontWeight: 500 };
const input: React.CSSProperties = {
  padding: "10px 12px", minHeight: 40, fontSize: 14, borderRadius: 6,
  border: "1px solid var(--role-border)", background: "var(--role-surface)", color: "var(--role-text)", width: "100%",
};
const pill = (active: boolean): React.CSSProperties => ({
  display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 500,
  background: active ? "rgba(46,125,50,0.12)" : "rgba(0,0,0,0.06)",
  color: active ? "#2e7d32" : "var(--role-text-muted)",
});

function Feedback({ msg }: { msg: string | null }) {
  if (!msg) return null;
  const isErr = msg.startsWith("✗");
  return (
    <div style={{ marginTop: 10, fontSize: 13, padding: "8px 12px", borderRadius: 6,
      background: isErr ? "rgba(198,40,40,0.08)" : "rgba(46,125,50,0.08)",
      color: isErr ? "#c62828" : "#2e7d32" }}>
      {msg}
    </div>
  );
}

/** Inline confirm: first click arms ("Confirm?"), second click fires. */
function useConfirmAction() {
  const [armed, setArmed] = useState<string | null>(null);
  const wrap = (id: string, fn: () => Promise<void>) => async () => {
    if (armed !== id) { setArmed(id); return; }
    setArmed(null);
    await fn();
  };
  return { armed, wrap, disarm: () => setArmed(null) };
}

async function api(path: string, method: string, body?: unknown): Promise<{ ok: boolean; data: any }> {
  try {
    const res = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.ok !== false, data };
  } catch {
    return { ok: false, data: { error: "Network error — try again." } };
  }
}

// ---- main -----------------------------------------------------------------------

export function ConfigConsole(props: {
  initialCategories: CategoryRow[];
  initialCampuses: CampusRow[];
  initialAgreements: AgreementRow[];
  initialFlags: FlagRow[];
}) {
  const [section, setSection] = useState<Section>("categories");

  const navBtn = (key: Section, label: string, count: number) => (
    <button
      key={key}
      onClick={() => setSection(key)}
      className="voeq-pill"
      style={{
        ...(section === key ? { background: "var(--role-accent-strong)", color: "#fff", borderColor: "var(--role-accent-strong)" } : {}),
        minHeight: 40, padding: "0 16px", borderRadius: 999, fontSize: 13, fontWeight: 500,
        cursor: "pointer", whiteSpace: "nowrap",
      }}
    >
      {label} ({count})
    </button>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "4px 0 16px", WebkitOverflowScrolling: "touch" }} className="config-section-nav">
        {navBtn("categories", "Categories", props.initialCategories.length)}
        {navBtn("campuses", "Campuses", props.initialCampuses.length)}
        {navBtn("agreements", "Agreements", props.initialAgreements.length)}
        {navBtn("flags", "Feature flags", props.initialFlags.length)}
      </div>
      {section === "categories" && <CategoriesPanel initial={props.initialCategories} />}
      {section === "campuses" && <CampusesPanel initial={props.initialCampuses} />}
      {section === "agreements" && <AgreementsPanel initial={props.initialAgreements} />}
      {section === "flags" && <FlagsPanel initial={props.initialFlags} />}
    </div>
  );
}

// ---- Categories -----------------------------------------------------------------

function CategoriesPanel({ initial }: { initial: CategoryRow[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const { wrap, disarm } = useConfirmAction();

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 6000); };

  async function createCat() {
    if (!newSlug.trim() || !newName.trim()) { flash("✗ Slug and name are required."); return; }
    setBusy(true);
    const r = await api("/api/staff/categories", "POST", { slug: newSlug, name: newName });
    setBusy(false);
    if (!r.ok) { flash(`✗ ${r.data.error ?? "Failed."}`); return; }
    setRows(await refreshCats());
    setNewSlug(""); setNewName(""); setShowCreate(false);
    flash(`✓ Created "${r.data.category?.name ?? newName}". Note: appears on Explore after the chips seam is wired.`);
  }
  async function renameCat(slug: string, name: string) {
    setBusy(true);
    const r = await api("/api/staff/categories", "PATCH", { slug, name, action: "rename" });
    setBusy(false);
    if (!r.ok) { flash(`✗ ${r.data.error ?? "Failed."}`); return; }
    setRows((rs) => rs.map((r2) => (r2.slug === slug ? { ...r2, name } : r2)));
    setEditingSlug(null);
    flash(`✓ Renamed to "${name}".`);
  }
  async function setActive(slug: string, isActive: boolean) {
    setBusy(true);
    const r = await api("/api/staff/categories", "PATCH", { slug, isActive });
    setBusy(false);
    if (!r.ok) { flash(`✗ ${r.data.error ?? "Failed."}`); return; }
    setRows((rs) => rs.map((r2) => (r2.slug === slug ? { ...r2, isActive } : r2)));
    flash(isActive ? "✓ Category reactivated." : "✓ Category deactivated (hidden from future Explore wiring).");
  }
  async function refreshCats(): Promise<CategoryRow[]> {
    const r = await api("/api/staff/categories", "GET");
    return r.ok ? (r.data.categories ?? []) : initial;
  }

  return (
    <SectionCard title="Categories" count={rows.length} note="Created categories are stored in the DB but do not yet appear on Explore — the chips seam (Explore reads the static seed) is a separate batch.">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--role-text-muted)" }}>Marketplace taxonomy</span>
        <button style={btn()} onClick={() => { setShowCreate(!showCreate); setEditingSlug(null); }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Plus size={14} /> New category</span>
        </button>
      </div>

      {showCreate && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px,100%), 1fr))", gap: 10, padding: 14, border: "1px solid var(--role-border)", borderRadius: 8, marginBottom: 14, background: "var(--role-surface-sunken)" }}>
          <input style={input} placeholder="Slug (e.g. stationery-supplies)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
          <input style={input} placeholder="Display name (e.g. Stationery Supplies)" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <button style={primaryBtn} disabled={busy} onClick={createCat}>Create</button>
            <button style={btn()} onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((c) => (
          <div key={c.slug} style={{ padding: 12, border: "1px solid var(--role-border)", borderRadius: 6 }}>
            {editingSlug === c.slug ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input style={{ ...input, maxWidth: 300 }} value={editName} onChange={(e) => setEditName(e.target.value)} aria-label="Category name" />
                <button style={primaryBtn} disabled={busy} onClick={() => renameCat(c.slug, editName)}>Save</button>
                <button style={btn()} onClick={() => setEditingSlug(null)}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--role-text)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, display: "inline-block", flexShrink: 0 }} />
                    {c.name}
                    {c.isActive === false && <span style={pill(false)}>Deactivated</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--role-text-muted)", marginTop: 2 }}>{c.slug}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={btn()} onClick={() => { setEditingSlug(c.slug); setEditName(c.name); disarm(); }}>Edit</button>
                  {c.isActive === false ? (
                    <button style={btn()} disabled={busy} onClick={wrap(`cat-on-${c.slug}`, () => setActive(c.slug, true))}>Reactivate</button>
                  ) : (
                    <button style={btn()} disabled={busy} onClick={wrap(`cat-off-${c.slug}`, () => setActive(c.slug, false))}>Deactivate</button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <Feedback msg={msg} />
    </SectionCard>
  );
}

// ---- Campuses --------------------------------------------------------------------

function CampusesPanel({ initial }: { initial: CampusRow[] }) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const { wrap, disarm } = useConfirmAction();

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 6000); };
  const filtered = q.trim().length < 2 ? rows : rows.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()) || c.slug.includes(q.trim().toLowerCase()));

  async function createCampus() {
    if (!newName.trim() || !newSlug.trim()) { flash("✗ Name and slug are required."); return; }
    setBusy(true);
    const r = await api("/api/staff/campuses", "POST", { name: newName, slug: newSlug, city: newCity || undefined, state: newState || undefined });
    setBusy(false);
    if (!r.ok) { flash(`✗ ${r.data.error ?? "Failed."}`); return; }
    const c = r.data.campus;
    setRows((rs) => [...rs, { id: c.id, slug: c.slug, name: c.name, city: c.city ?? null, state: c.state ?? null, status: c.status }]);
    setNewName(""); setNewSlug(""); setNewCity(""); setNewState(""); setShowCreate(false);
    flash("✓ Campus created (unverified — verify it to surface it on Explore).");
  }
  async function setStatus(slug: string, status: "verified" | "unverified") {
    setBusy(true);
    const r = await api("/api/staff/campuses", "PATCH", { slug, action: status === "verified" ? "verify" : "unverify" });
    setBusy(false);
    if (!r.ok) { flash(`✗ ${r.data.error ?? "Failed."}`); return; }
    setRows((rs) => rs.map((r2) => (r2.slug === slug ? { ...r2, status } : r2)));
    flash(status === "verified" ? "✓ Campus verified — now visible on Explore." : "✓ Campus unverified — hidden from new Explore visitors.");
  }

  return (
    <SectionCard title="Campuses" count={rows.length}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
        <input style={{ ...input, maxWidth: 340 }} placeholder="Search campuses (2+ chars)…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button style={btn()} onClick={() => { setShowCreate(!showCreate); disarm(); }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Plus size={14} /> New campus</span>
        </button>
      </div>

      {showCreate && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px,100%), 1fr))", gap: 10, padding: 14, border: "1px solid var(--role-border)", borderRadius: 8, marginBottom: 14, background: "var(--role-surface-sunken)" }}>
          <input style={input} placeholder="Name (e.g. University of Lagos)" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input style={input} placeholder="Slug (e.g. unilag)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
          <input style={input} placeholder="City (optional)" value={newCity} onChange={(e) => setNewCity(e.target.value)} />
          <input style={input} placeholder="State (optional)" value={newState} onChange={(e) => setNewState(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <button style={primaryBtn} disabled={busy} onClick={createCampus}>Create</button>
            <button style={btn()} onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((c) => (
          <div key={c.slug} style={{ padding: 12, border: "1px solid var(--role-border)", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--role-text)", display: "flex", alignItems: "center", gap: 8 }}>
                {c.name}
                <span style={pill(c.status === "verified")}>{c.status}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--role-text-muted)", marginTop: 2 }}>
                {c.slug}{c.city ? ` · ${c.city}` : ""}{c.state ? `, ${c.state}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {c.status === "verified" ? (
                <button style={btn()} disabled={busy} onClick={wrap(`camp-unv-${c.slug}`, () => setStatus(c.slug, "unverified"))}>Unverify</button>
              ) : (
                <button style={primaryBtn} disabled={busy} onClick={wrap(`camp-v-${c.slug}`, () => setStatus(c.slug, "verified"))}>Verify</button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ fontSize: 13, color: "var(--role-text-muted)", padding: 8 }}>No campuses match.</div>}
      </div>
      <Feedback msg={msg} />
    </SectionCard>
  );
}

// ---- Agreements --------------------------------------------------------------------

function AgreementsPanel({ initial }: { initial: AgreementRow[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [kind, setKind] = useState<"terms" | "privacy" | "vendor">("terms");
  const [version, setVersion] = useState("");
  const [body, setBody] = useState("");
  const { wrap, disarm } = useConfirmAction();

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 8000); };

  async function publish() {
    if (!version.trim() || !body.trim()) { flash("✗ Version and body are required."); return; }
    setBusy(true);
    const r = await api("/api/staff/agreements", "POST", { kind, version, body });
    setBusy(false);
    if (!r.ok) { flash(`✗ ${r.data.error ?? "Failed."}`); return; }
    const a = r.data.agreement;
    setRows((rs) => [...rs, { id: a.id, kind: a.kind, version: a.version, body: a.body, effectiveAt: a.effectiveAt, isCurrent: false }]);
    setVersion(""); setBody(""); setShowPublish(false);
    flash(`✓ Draft saved (${a.kind} v${a.version}). Promote it to current below when ready — promoting makes users re-consent.`);
  }
  async function promote(a: AgreementRow) {
    setBusy(true);
    const r = await api("/api/staff/agreements", "PATCH", { id: a.id });
    setBusy(false);
    if (!r.ok) { flash(`✗ ${r.data.error ?? "Failed."}`); return; }
    // kind-scoped current: only the same kind loses current
    setRows((rs) => rs.map((r2) => (r2.kind === a.kind ? { ...r2, isCurrent: r2.id === a.id } : r2)));
    flash(`✓ ${a.kind} v${a.version} is now current. Users with older acceptances will be asked to re-consent at next login.`);
  }

  const byKind = (k: AgreementRow["kind"]) => rows.filter((a) => a.kind === k);

  return (
    <SectionCard title="Agreements" count={rows.length} note="Promoting a new version makes every user whose latest acceptance is older re-consent at their next login. Current versions are what consent checks compare against.">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--role-text-muted)" }}>Terms · Privacy · Vendor</span>
        <button style={btn()} onClick={() => { setShowPublish(!showPublish); disarm(); }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Plus size={14} /> Publish version</span>
        </button>
      </div>

      {showPublish && (
        <div style={{ padding: 14, border: "1px solid var(--role-border)", borderRadius: 8, marginBottom: 14, background: "var(--role-surface-sunken)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px,100%), 1fr))", gap: 10 }}>
            <select style={input} value={kind} onChange={(e) => setKind(e.target.value as AgreementRow["kind"])} aria-label="Agreement kind">
              <option value="terms">Terms of Service</option>
              <option value="privacy">Privacy Policy</option>
              <option value="vendor">Vendor Agreement</option>
            </select>
            <input style={input} placeholder="Version (e.g. 2026-09-05)" value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>
          <textarea style={{ ...input, minHeight: 120, resize: "vertical" }} placeholder="Body — the full text of this version (the public /terms and /privacy pages render their own canonical copy; this body is the versioning source of truth)" value={body} onChange={(e) => setBody(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <button style={primaryBtn} disabled={busy} onClick={publish}>Save draft version</button>
            <button style={btn()} onClick={() => setShowPublish(false)}>Cancel</button>
          </div>
        </div>
      )}

      {(["terms", "privacy", "vendor"] as const).map((k) => (
        <div key={k} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--role-text)", marginBottom: 8, textTransform: "capitalize" }}>{k}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {byKind(k).length === 0 && <div style={{ fontSize: 12, color: "var(--role-text-muted)", padding: 4 }}>No versions yet.</div>}
            {byKind(k).map((a) => (
              <div key={a.id} style={{ padding: 12, border: "1px solid var(--role-border)", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--role-text)", display: "flex", alignItems: "center", gap: 8 }}>
                    v{a.version}
                    {a.isCurrent && <span style={pill(true)}>Current</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--role-text-muted)", marginTop: 2 }}>effective {a.effectiveAt.slice(0, 10)}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {a.isCurrent ? (
                    <span style={{ fontSize: 12, color: "var(--role-text-muted)", alignSelf: "center" }}>Live — consent compares against this</span>
                  ) : (
                    <button style={primaryBtn} disabled={busy} onClick={wrap(`agr-${a.id}`, () => promote(a))}>Promote to current</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Feedback msg={msg} />
    </SectionCard>
  );
}

// ---- Feature Flags --------------------------------------------------------------------

function FlagsPanel({ initial }: { initial: FlagRow[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [key_, setKey] = useState("");
  const [desc, setDesc] = useState("");

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 6000); };

  async function createFlag() {
    if (!key_.trim()) { flash("✗ Key is required."); return; }
    setBusy(true);
    const r = await api("/api/staff/feature-flags", "POST", { key: key_, description: desc, value: true });
    setBusy(false);
    if (!r.ok) { flash(`✗ ${r.data.error ?? "Failed."}`); return; }
    const f = r.data.flag;
    setRows((rs) => [...rs, { key: f.key, value: f.value, description: f.description ?? "" }]);
    setKey(""); setDesc(""); setShowCreate(false);
    flash("✓ Flag created and ON. Note: no runtime path reads flags yet — this is stored state for future enforcement.");
  }
  async function toggle(f: FlagRow) {
    setBusy(true);
    const r = await api("/api/staff/feature-flags", "PATCH", { key: f.key, value: !f.value });
    setBusy(false);
    if (!r.ok) { flash(`✗ ${r.data.error ?? "Failed."}`); return; }
    setRows((rs) => rs.map((r2) => (r2.key === f.key ? { ...r2, value: !f.value } : r2)));
    flash(`✓ ${f.key} → ${!f.value ? "ON" : "OFF"}.`);
  }

  return (
    <SectionCard title="Feature flags" count={rows.length} note="Honest state: no runtime code reads these flags yet. They store rollout intent for future enforcement wiring — toggling does not change app behavior today.">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--role-text-muted)" }}>Rollout switches</span>
        <button style={btn()} onClick={() => setShowCreate(!showCreate)}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Plus size={14} /> New flag</span>
        </button>
      </div>

      {showCreate && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px,100%), 1fr))", gap: 10, padding: 14, border: "1px solid var(--role-border)", borderRadius: 8, marginBottom: 14, background: "var(--role-surface-sunken)" }}>
          <input style={input} placeholder="Key (e.g. explore.chips-from-db)" value={key_} onChange={(e) => setKey(e.target.value)} />
          <input style={input} placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <button style={primaryBtn} disabled={busy} onClick={createFlag}>Create ON</button>
            <button style={btn()} onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((f) => (
          <div key={f.key} style={{ padding: 12, border: "1px solid var(--role-border)", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--role-text)", fontFamily: "var(--font-mono, monospace)" }}>{f.key}</div>
              {f.description && <div style={{ fontSize: 12, color: "var(--role-text-muted)", marginTop: 2 }}>{f.description}</div>}
            </div>
            <button style={btn(f.value ? { background: "rgba(46,125,50,0.12)", borderColor: "#2e7d32" } : undefined)} disabled={busy} onClick={() => toggle(f)}>
              {f.value ? "ON" : "OFF"}
            </button>
          </div>
        ))}
        {rows.length === 0 && <div style={{ fontSize: 13, color: "var(--role-text-muted)", padding: 8 }}>No flags defined yet.</div>}
      </div>
      <Feedback msg={msg} />
    </SectionCard>
  );
}
