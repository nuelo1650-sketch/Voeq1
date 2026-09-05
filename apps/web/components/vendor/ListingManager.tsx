"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// BUNDLE FIX (2026-09-05): barrel import — root ships drizzle+neon to browser.
import { categories } from "@voeq/data/client";

interface ListingRow {
  id: string;
  title: string;
  priceMinMinor: number;
  priceMaxMinor: number | null;
  categoryId: string;
  description: string | null;
  images: string[];
  isPublished?: boolean;
  status?: string;
}

interface PerListingStat { id: string; views: number; saves: number; }

/**
 * VENDOR LISTINGS — redesigned 2026-09-04 (mock v1 GO), mobile-first.
 *
 * Status cards (LIVE pulse pill / DRAFT), filter segments, per-card health
 * (real views+saves from /api/vendor/weekly perListing), footer action rows
 * (Edit / View / Delete). Inline edit form kept — same API contract
 * (PATCH /api/listings/[id]), re-skinned to match.
 *
 * Honest-data: a listing with zero views shows 0; drafts show "finish
 * setting up" instead of fake metrics.
 */
export function ListingManager({ initial }: { initial: ListingRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "live" | "draft">("all");
  const [stats, setStats] = useState<Map<string, PerListingStat>>(new Map());

  // real per-listing stats (views/saves) from the weekly endpoint
  useEffect(() => {
    let cancelled = false;
    fetch("/api/vendor/weekly")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { perListing?: PerListingStat[] }) => {
        if (!cancelled && d.perListing) {
          setStats(new Map(d.perListing.map((p) => [p.id, p])));
        }
      })
      .catch(() => { /* honest: cards fall back to "gathering data" */ });
    return () => { cancelled = true; };
  }, []);

  const isLive = (l: ListingRow) => l.isPublished && l.status === "active";
  const liveCount = initial.filter(isLive).length;
  const draftCount = initial.length - liveCount;
  const visible = initial.filter((l) =>
    filter === "all" ? true : filter === "live" ? isLive(l) : !isLive(l),
  );

  return (
    <section data-testid="listings-section" style={{ paddingBottom: "calc(76px + env(safe-area-inset-bottom, 0px))" }}>
      {/* header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(21px, 4vw, 28px)", fontWeight: 600, margin: 0, color: "var(--color-forest)" }}>
              My listings
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: 13.5, color: "var(--role-text-muted)" }}>
              {initial.length} listing{initial.length === 1 ? "" : "s"} · {liveCount} live · {draftCount} draft{draftCount === 1 ? "" : "s"}
            </p>
          </div>
          <Link
            href="/vendor/listings/create"
            data-testid="listing-add-cta"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "var(--color-amber)", color: "var(--color-forest)",
              fontWeight: 700, fontSize: 13, textDecoration: "none",
              padding: "11px 18px", borderRadius: 11,
              boxShadow: "0 6px 18px rgba(232,163,61,.32)",
            }}
          >
            ＋ New listing
          </Link>
        </div>

        {/* filter segments */}
        <div data-testid="listing-segments" style={{ display: "inline-flex", alignSelf: "flex-start", background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 11, padding: 3, gap: 2 }}>
          {([
            ["all", `All ${initial.length}`],
            ["live", `Live ${liveCount}`],
            ["draft", `Drafts ${draftCount}`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                border: "none", background: filter === key ? "var(--color-forest)" : "transparent",
                color: filter === key ? "#f3f1ea" : "var(--role-text-muted)",
                fontFamily: "var(--role-font-ui)", fontSize: 12.5, fontWeight: 600,
                padding: "7px 14px", borderRadius: 8, cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {initial.length === 0 ? (
        <div
          data-testid="listing-empty"
          style={{
            border: "1.5px dashed var(--role-border)", borderRadius: 14,
            padding: "28px 18px", textAlign: "center",
          }}
        >
          <p style={{ color: "var(--role-text-muted)", margin: "0 0 12px", fontSize: 13.5 }}>
            No listings yet — your storefront is waiting.
          </p>
          <Link
            href="/vendor/listings/create"
            data-testid="listing-empty-cta"
            className="auth-submit"
            style={{ ...smallBtn, display: "inline-block", textDecoration: "none" }}
          >
            Create your first listing
          </Link>
        </div>
      ) : (
        <div data-testid="listing-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {visible.map((l) => (
            <ListingCard key={l.id} listing={l} stat={stats.get(l.id)} onEdit={() => setEditingId(l.id)} />
          ))}
        </div>
      )}

      {editingId && (
        <ListingEditModal listing={initial.find((l) => l.id === editingId)!} onDone={() => { setEditingId(null); router.refresh(); }} />
      )}
    </section>
  );
}

/* ============ card ============ */

function ListingCard({ listing, stat, onEdit }: { listing: ListingRow; stat?: PerListingStat; onEdit: () => void }) {
  const router = useRouter();
  const live = listing.isPublished && listing.status === "active";
  const img = listing.images?.[0];
  return (
    <div
      data-testid="listing-item"
      style={{
        background: "var(--role-surface)", border: "1px solid var(--role-border)",
        borderRadius: 15, overflow: "hidden", boxShadow: "0 1px 4px rgba(15,42,29,.05)",
        display: "flex", flexDirection: "column", opacity: live ? 1 : 0.88,
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16/10", background: "var(--color-amber-soft, rgba(232,163,61,.14))", display: "grid", placeItems: "center" }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={listing.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span aria-hidden style={{ fontSize: 30 }}>🛍</span>
        )}
        {live ? (
          <span data-testid={`listing-status-live-${listing.id}`} style={{ position: "absolute", top: 9, left: 9, display: "inline-flex", alignItems: "center", gap: 5, background: "var(--color-forest)", color: "#f3f1ea", fontSize: 9.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 999 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-amber)", animation: "listingPulse 1.8s infinite" }} /> Live
          </span>
        ) : (
          <span style={{ position: "absolute", top: 9, left: 9, background: "var(--color-cream)", color: "var(--role-text-muted)", border: "1px solid var(--role-border)", fontSize: 9.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 999 }}>
            Draft
          </span>
        )}
        {live && stat && (stat.views > 0 || stat.saves > 0) && (
          <span style={{ position: "absolute", bottom: 9, right: 9, background: "rgba(11,31,21,.72)", color: "#f3f1ea", backdropFilter: "blur(3px)", fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 999 }}>
            👁 {stat.views}
          </span>
        )}
      </div>
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <span style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{listing.title}</span>
        <span style={{ fontFamily: "var(--role-font-display)", fontWeight: 700, fontSize: 15.5, color: "var(--color-forest)" }}>
          ₦{Math.round(listing.priceMinMinor / 100).toLocaleString("en-NG")}
          {listing.priceMaxMinor ? ` – ₦${Math.round(listing.priceMaxMinor / 100).toLocaleString("en-NG")}` : ""}
        </span>
        {live && stat ? (
          <span style={{ fontSize: 11.5, color: "var(--role-text-muted)", marginTop: 2 }}>
            🔖 {stat.saves} saves · 👁 {stat.views} views
          </span>
        ) : !live ? (
          <span style={{ fontSize: 11.5, color: "var(--role-text-muted)", fontStyle: "italic", marginTop: 2 }}>finish setting up</span>
        ) : (
          <span style={{ fontSize: 11.5, color: "var(--role-text-muted)", marginTop: 2 }}>gathering data…</span>
        )}
      </div>
      <div style={{ display: "flex", borderTop: "1px solid var(--role-border)", marginTop: "auto" }}>
        <button data-testid={`listing-edit-${listing.id}`} onClick={onEdit} style={footBtn}>
          ✎ Edit
        </button>
        <Link href={`/listing/${listing.id}`} data-testid={`listing-view-${listing.id}`} style={{ ...footBtn, textDecoration: "none" }}>
          👁 View
        </Link>
        <ListingRemoveButton id={listing.id} onDone={() => router.refresh()} />
      </div>
    </div>
  );
}

const footBtn: React.CSSProperties = {
  flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
  background: "none", border: "none", borderRight: "1px solid var(--role-border)",
  fontFamily: "var(--role-font-ui)", fontSize: 12.5, fontWeight: 600, color: "var(--role-text)",
  padding: "10px 4px", cursor: "pointer",
};

/* ============ edit modal (same API: PATCH /api/listings/[id]) ============ */

function ListingEditModal({ listing, onDone }: { listing: ListingRow; onDone: () => void }) {
  const [title, setTitle] = useState(listing.title);
  const [categoryId, setCategoryId] = useState(listing.categoryId);
  const [priceMinMinor, setPriceMinMinor] = useState(String(listing.priceMinMinor));
  const [priceMaxMinor, setPriceMaxMinor] = useState(listing.priceMaxMinor != null ? String(listing.priceMaxMinor) : "");
  const [description, setDescription] = useState(listing.description ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setStatus("saving");
    setError(null);
    const res = await fetch(`/api/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        categoryId,
        priceMinMinor,
        priceMaxMinor: priceMaxMinor === "" ? null : priceMaxMinor,
        description,
      }),
    });
    if (res.ok) onDone();
    else {
      const e = await res.json().catch(() => ({}));
      setError(e.error ?? "save_failed");
      setStatus("error");
    }
  }

  return (
    <div
      data-testid={`listing-edit-form-${listing.id}`}
      role="dialog"
      aria-label={`Edit ${listing.title}`}
      style={{
        position: "fixed", inset: 0, zIndex: 90,
        background: "rgba(11,31,21,.5)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: 0,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onDone(); }}
    >
      <div style={{
        background: "var(--role-surface)", borderRadius: "18px 18px 0 0",
        width: "100%", maxWidth: 520, maxHeight: "86vh", overflowY: "auto",
        padding: "18px 18px calc(18px + env(safe-area-inset-bottom, 0px))",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, margin: 0, color: "var(--color-forest)" }}>Edit listing</h3>
          <button onClick={onDone} aria-label="Close" style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--role-text-muted)", padding: "4px 8px" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelStyle} htmlFor={`edit-title-${listing.id}`}>Title</label>
          <input id={`edit-title-${listing.id}`} data-testid="listing-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelStyle} htmlFor={`edit-cat-${listing.id}`}>Category</label>
          <select id={`edit-cat-${listing.id}`} data-testid="listing-edit-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputStyle}>
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={labelStyle} htmlFor={`edit-pmin-${listing.id}`}>Price min (₦)</label>
            <input id={`edit-pmin-${listing.id}`} data-testid="listing-edit-price-min" value={priceMinMinor} onChange={(e) => setPriceMinMinor(e.target.value)} style={inputStyle} inputMode="numeric" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={labelStyle} htmlFor={`edit-pmax-${listing.id}`}>Price max (₦)</label>
            <input id={`edit-pmax-${listing.id}`} data-testid="listing-edit-price-max" value={priceMaxMinor} onChange={(e) => setPriceMaxMinor(e.target.value)} style={inputStyle} inputMode="numeric" />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelStyle} htmlFor={`edit-desc-${listing.id}`}>Description</label>
          <textarea id={`edit-desc-${listing.id}`} data-testid="listing-edit-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button data-testid="listing-edit-save" onClick={save} disabled={status === "saving"} className="auth-submit" style={{ flex: 1 }}>
            {status === "saving" ? "Saving…" : "Save changes"}
          </button>
          <button data-testid="listing-edit-cancel" onClick={onDone} className="auth-submit" style={{ ...smallBtn, background: "var(--role-surface)", flex: "0 0 auto" }}>
            Cancel
          </button>
        </div>
        {status === "error" && (
          <span data-testid="listing-edit-error" style={{ fontSize: 13, color: "var(--role-danger)" }}>{error}</span>
        )}
      </div>
    </div>
  );
}

/* ============ remove (unchanged API: DELETE /api/listings/[id]) ============ */

function ListingRemoveButton({ id, onDone }: { id: string; onDone: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) onDone();
    else {
      const e = await res.json().catch(() => ({}));
      setError(e.error ?? "delete_failed");
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        data-testid={`listing-remove-${id}`}
        onClick={() => setConfirming(true)}
        style={{ ...footBtn, color: "var(--role-danger)", borderRight: "none" }}
      >
        🗑
      </button>
    );
  }
  return (
    <span style={{ display: "flex", flex: 1.4 }} data-testid={`listing-confirm-${id}`}>
      <button onClick={remove} disabled={busy} style={{ ...footBtn, color: "var(--role-danger)", fontWeight: 700 }}>
        {busy ? "…" : "Sure?"}
      </button>
      <button onClick={() => setConfirming(false)} style={{ ...footBtn, borderRight: "none" }}>
        Keep
      </button>
      {error && <span style={{ fontSize: 11, color: "var(--role-danger)", alignSelf: "center", paddingRight: 6 }}>{error}</span>}
    </span>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: "var(--role-text-muted)" };
const inputStyle: React.CSSProperties = {
  fontFamily: "var(--role-font-ui)", fontSize: 14.5, padding: "10px 12px",
  borderRadius: 10, border: "1px solid var(--role-border)",
  background: "var(--role-bg, #fff)", color: "var(--role-text)", width: "100%",
};
const smallBtn: React.CSSProperties = {
  padding: "10px 16px", fontSize: 13, fontWeight: 650, borderRadius: 999,
  border: "none", background: "var(--color-forest)", color: "var(--color-cream)", cursor: "pointer",
};
