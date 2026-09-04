"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Eye, MessageSquare, BarChart3, Store, ArrowUpRight, MapPin, Heart, TrendingUp, Minus } from "lucide-react";
import type { ExploreListing } from "@voeq/data";

/**
 * VENDOR DASHBOARD — WARM COMMAND CENTER (redesign 2026-09-04, mock v2 GO).
 *
 * The four upgrades over r68's command center:
 *   1. Storefront hero — the vendor's identity as their SHOP (photo, LIVE
 *      pill, verified, campus/category/followers, view-storefront CTA).
 *   2. Conversations strip — unread badge + last-message preview + reply;
 *      messages are sales, they get priority placement.
 *   3. This week with a hero metric (views) + honest week-over-week trends
 *      (needs /api/vendor/weekly prev{} — new in this redesign).
 *   4. Per-listing health — real views/saves per listing + Top performer.
 *
 * All numbers REAL (page_events / messages / wishlist / follows) — the mock's
 * illustrative numbers never ship. Honest-data rule: no fabricated analytics.
 */
interface Props {
  vendor: {
    id: string;
    name: string;
    status: string;
    verified?: boolean;
    campus?: string | null;
    profilePhotoUrl?: string | null;
    categoryIds?: string[];
  };
  followersCount: number;
  listings: Array<{
    id: string;
    title: string;
    description: string | null;
    priceMinMinor: number;
    priceMaxMinor: number | null;
    images: string[];
    isPublished: boolean;
    status: string;
    categorySlug?: string | null;
    vendorName?: string;
  }>;
}

const PRICE = (v: number) => `₦${(v / 100).toLocaleString("en-NG")}`;

/* ---------- data hooks ---------- */

interface WeeklyResponse {
  week: { views: number; messages: number; saves: number; followers: number };
  prev?: { views: number; messages: number; saves: number; followers: number };
  perListing?: Array<{ id: string; views: number; saves: number }>;
}

function useWeekly() {
  const [data, setData] = useState<WeeklyResponse | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/vendor/weekly")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: WeeklyResponse) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);
  return { data, error };
}

interface ConversationRow {
  id: string;
  name: string;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  unread: number;
}

function useConversations() {
  const [rows, setRows] = useState<ConversationRow[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/conversations")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { conversations?: ConversationRow[] }) => { if (!cancelled) setRows(d.conversations ?? []); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);
  return { rows, error };
}

/* ---------- helpers ---------- */

function trendLabel(thisW: number, prev: number | undefined): { text: string; up: boolean | null } {
  if (prev === undefined || prev === 0) {
    return thisW > 0 ? { text: `${thisW} this week`, up: null } : { text: "first week", up: null };
  }
  const diff = thisW - prev;
  if (diff === 0) return { text: "same as last week", up: null };
  if (diff > 0) return { text: `↑ ${diff} vs last week`, up: true };
  return { text: `↓ ${Math.abs(diff)} vs last week`, up: false };
}

function relTime(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/* ---------- main ---------- */

export function VendorDashboardClient({ vendor, followersCount, listings }: Props) {
  const live = vendor.status === "live";
  const { data: weekly, error: weeklyError } = useWeekly();
  const { rows: conversations, error: convError } = useConversations();

  const liveCount = listings.filter((l) => l.isPublished && l.status === "active").length;
  const draftCount = listings.length - liveCount;

  const perListing = new Map((weekly?.perListing ?? []).map((p) => [p.id, p]));
  const topListingId = (() => {
    let best: { id: string; score: number } | null = null;
    for (const [id, p] of perListing) {
      const score = p.views + p.saves * 3;
      if (!best || score > best.score) best = { id, score };
    }
    return best && best.score > 0 ? best.id : null;
  })();

  const withUnread = (conversations ?? []).filter((c) => c.unread > 0);
  const recentConvs = (conversations ?? []).slice(0, 2);

  return (
    <div data-testid="vendor-dashboard-client" style={{ display: "flex", flexDirection: "column", gap: 18, paddingTop: 4, paddingBottom: "calc(76px + env(safe-area-inset-bottom, 0px))" }}>
      {/* ============ STOREFRONT HERO ============ */}
      <section
        aria-label="Your storefront"
        data-testid="vendor-hero"
        style={{
          display: "flex",
          borderRadius: 18,
          overflow: "hidden",
          background: "linear-gradient(135deg, var(--color-forest) 0%, #16382a 62%, #1d4a35 100%)",
          color: "#f3f1ea",
          boxShadow: "0 12px 32px rgba(15,42,29,.18)",
        }}
      >
        <div
          role="img"
          aria-label={vendor.profilePhotoUrl ? `${vendor.name} storefront photo` : "Add a storefront photo"}
          style={{
            flex: "0 0 auto",
            width: 118,
            minHeight: 168,
            background: vendor.profilePhotoUrl
              ? `url(${vendor.profilePhotoUrl}) center/cover`
              : "var(--color-amber-soft, rgba(232,163,61,.18))",
            display: "grid",
            placeItems: "center",
            borderRight: "1px solid rgba(243,241,234,.14)",
            fontSize: 34,
          }}
        >
          {!vendor.profilePhotoUrl && <span aria-hidden>📷</span>}
        </div>
        <div style={{ flex: 1, padding: "16px 16px 16px 18px", display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {live ? (
              <span data-testid="hero-live-pill" style={pillStyle.live}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-forest)", animation: "heroPulse 1.8s infinite" }} />
                Live
              </span>
            ) : (
              <span data-testid="hero-live-pill" style={pillStyle.offline}>Offline</span>
            )}
            {vendor.verified && (
              <span style={pillStyle.verified} title="Verified vendor">✓ Verified</span>
            )}
          </div>
          <h1 style={{ fontFamily: "var(--role-font-display)", fontSize: "clamp(21px, 4vw, 30px)", fontWeight: 600, lineHeight: 1.1, margin: 0, color: "#f3f1ea" }}>
            {vendor.name}
          </h1>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12.5, color: "rgba(243,241,234,.78)" }}>
            {vendor.campus && (
              <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><MapPin size={13} /> {vendor.campus.replace(/-/g, " ")}</span>
            )}
            <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><Heart size={13} /> {followersCount} followers</span>
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: "auto", paddingTop: 6, flexWrap: "wrap" }}>
            <Link
              href={`/vendor/${vendor.id}`}
              data-testid="hero-view-storefront"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, flex: 1, justifyContent: "center",
                background: "var(--color-amber)", color: "var(--color-forest)",
                fontWeight: 700, fontSize: 13, textDecoration: "none",
                padding: "10px 14px", borderRadius: 10,
                boxShadow: "0 6px 18px rgba(232,163,61,.35)",
              }}
            >
              <Eye size={15} /> View storefront
            </Link>
            <Link
              href="/vendor/storefront"
              data-testid="hero-edit"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, flex: 1, justifyContent: "center",
                border: "1px solid rgba(243,241,234,.32)", color: "#f3f1ea",
                fontWeight: 600, fontSize: 13, textDecoration: "none", padding: "10px 12px", borderRadius: 10,
              }}
            >
              <Store size={15} /> Edit
            </Link>
          </div>
        </div>
      </section>
      <style>{`@keyframes heroPulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }`}</style>

      {/* ============ CONVERSATIONS ============ */}
      <section aria-label="Conversations" data-testid="vendor-conversations">
        {convError ? (
          <div style={convShellStyle}><p style={{ fontSize: 13, color: "var(--role-danger)", margin: 0, padding: 14 }}>Conversations are temporarily unavailable.</p></div>
        ) : recentConvs.length === 0 ? (
          <div style={convShellStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px" }}>
              <div style={avatarStyle(null)} aria-hidden>M</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>Messages</div>
                <div style={{ color: "var(--role-text-muted)", fontSize: 12.5 }}>No conversations yet — they start when a student messages you.</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={convShellStyle}>
            {recentConvs.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
                <div style={{ position: "relative", flex: "0 0 auto" }}>
                  <div style={avatarStyle(c.name)} aria-hidden>{c.name.charAt(0).toUpperCase()}</div>
                  {c.unread > 0 && (
                    <span data-testid={`conv-unread-${c.id}`} style={badgeStyle}>{c.unread}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, display: "flex", gap: 8, alignItems: "baseline" }}>
                    {c.name} <span style={{ color: "var(--role-text-muted)", fontSize: 11.5, fontWeight: 500 }}>{relTime(c.lastMessageAt)}</span>
                  </div>
                  <div style={{ color: "var(--role-text-muted)", fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.lastMessagePreview || "—"}
                  </div>
                </div>
                <Link
                  href={`/messages#${c.id}`}
                  data-testid={`conv-reply-${c.id}`}
                  style={{
                    flex: "0 0 auto",
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: c.unread > 0 ? "var(--color-forest)" : "transparent",
                    color: c.unread > 0 ? "#f3f1ea" : "var(--role-text)",
                    border: c.unread > 0 ? "none" : "1px solid var(--role-border)",
                    fontSize: 12, fontWeight: 600, textDecoration: "none",
                    padding: "7px 12px", borderRadius: 9,
                  }}
                >
                  {c.unread > 0 ? "Reply →" : "Open"}
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============ THIS WEEK ============ */}
      <section aria-label="This week" data-testid="vendor-weekly-section">
        <SectionTitle
          left={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><Eye size={17} color="var(--role-accent)" /> This week</span>}
        />
        {weeklyError ? (
          <p data-testid="weekly-error" style={{ fontSize: 13, color: "var(--role-danger)" }}>Weekly stats are temporarily unavailable.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 11 }}>
            <StatHero
              label="Storefront views"
              value={weekly ? weekly.week.views : "…"}
              trend={weekly ? trendLabel(weekly.week.views, weekly.prev?.views) : null}
              testid="weekly-views-hero"
            />
            <StatCompact label="Messages" icon={<MessageSquare size={14} />} value={weekly ? weekly.week.messages : "…"} trend={weekly ? trendLabel(weekly.week.messages, weekly.prev?.messages) : null} testid="weekly-messages" />
            <StatCompact label="Saves" icon={<span style={{ fontSize: 14 }}>🔖</span>} value={weekly ? weekly.week.saves : "…"} trend={weekly ? trendLabel(weekly.week.saves, weekly.prev?.saves) : null} testid="weekly-saves" />
            <StatCompact label="New followers" icon={<Heart size={14} />} value={weekly ? weekly.week.followers : "…"} trend={weekly ? trendLabel(weekly.week.followers, weekly.prev?.followers) : null} testid="weekly-followers" />
          </div>
        )}
      </section>

      {/* ============ QUICK ACTIONS ============ */}
      <section aria-label="Quick actions">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          {[
            { href: "/vendor/listings/create", label: "Create listing", icon: Plus, tone: "amber" as const },
            { href: "/vendor/analytics", label: "Analytics", icon: BarChart3, tone: "outline" as const },
          ].map((qa) => {
            const Icon = qa.icon;
            return (
              <Link
                key={qa.href}
                href={qa.href}
                data-testid={`quick-${qa.label.toLowerCase().replace(/\s+/g, "-")}`}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderRadius: 12,
                  textDecoration: "none", fontSize: 13, fontWeight: 600,
                  border: qa.tone === "amber" ? "none" : "1px solid var(--role-border)",
                  background: qa.tone === "amber" ? "var(--color-amber)" : "var(--role-surface)",
                  color: qa.tone === "amber" ? "var(--color-forest)" : "var(--role-text)",
                  boxShadow: qa.tone === "amber" ? "0 6px 16px rgba(232,163,61,.30)" : "0 1px 4px rgba(15,42,29,.06)",
                }}
              >
                <Icon size={16} /> {qa.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============ MY LISTINGS ============ */}
      <section aria-label="My listings">
        <SectionTitle
          left={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              Store <span style={{ color: "var(--role-text-muted)", fontWeight: 500, fontSize: 13 }}>·</span>
              <span style={{ fontSize: 13, color: "var(--role-text-muted)", fontWeight: 500 }}>{liveCount} live · {draftCount} draft</span>
            </span>
          }
          right={<Link href="/vendor/listings/create" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--role-gold)", textDecoration: "none" }}>+ Add listing</Link>}
        />
        {listings.length === 0 ? (
          <div data-testid="listings-empty" style={{ border: "1.5px dashed var(--role-border)", borderRadius: 14, padding: "26px 18px", textAlign: "center", color: "var(--role-text-muted)", fontSize: 13.5 }}>
            No listings yet. Your storefront is waiting —{" "}
            <Link href="/vendor/listings/create" style={{ color: "var(--role-gold)", fontWeight: 600, textDecoration: "none" }}>create your first one</Link>.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(215px, 1fr))", gap: 11 }}>
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} metrics={perListing.get(l.id)} isTop={l.id === topListingId} />
            ))}
          </div>
        )}
      </section>

      {/* ============ MORE ============ */}
      <section aria-label="More">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <TileLink href="/vendor/storefront" icon={<Store size={16} />} title="Storefront" desc="Photo, hours, socials" />
          <TileLink href="/vendor/reviews" icon={<span style={{ fontSize: 15 }}>★</span>} title="Reviews" desc="Ratings & feedback" />
        </div>
      </section>
    </div>
  );
}

/* ---------- subcomponents ---------- */

const pillStyle = {
  live: {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" as const,
    background: "var(--color-amber)", color: "var(--color-forest)",
    padding: "4px 11px", borderRadius: 999,
  },
  offline: {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" as const,
    border: "1px solid rgba(243,241,234,.32)", color: "rgba(243,241,234,.85)",
    padding: "4px 11px", borderRadius: 999,
  },
  verified: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 11, fontWeight: 600,
    border: "1px solid rgba(243,241,234,.28)", color: "#f3f1ea",
    padding: "4px 10px", borderRadius: 999,
  },
};

const convShellStyle = {
  background: "var(--role-surface)",
  border: "1px solid var(--role-border)",
  borderRadius: 14,
  overflow: "hidden",
  boxShadow: "0 1px 4px rgba(15,42,29,.05)",
} as const;

function avatarStyle(name: string | null): React.CSSProperties {
  return {
    width: 42, height: 42, borderRadius: "50%",
    display: "grid", placeItems: "center",
    fontWeight: 700, fontSize: 15, color: "var(--color-forest)",
    background: "var(--color-amber-soft, rgba(232,163,61,.14))",
    border: "1px solid rgba(232,163,61,.4)",
  };
}

const badgeStyle = {
  position: "absolute", top: -4, right: -6,
  background: "var(--color-danger, #c25242)", color: "#fff",
  fontSize: 10.5, fontWeight: 700,
  minWidth: 19, height: 19, borderRadius: 999,
  display: "grid", placeItems: "center", padding: "0 5px",
  border: "2px solid var(--role-surface)",
} as const;

function SectionTitle({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
      <h2 style={{ fontFamily: "var(--role-font-display)", fontSize: 19, fontWeight: 600, color: "var(--role-text)", margin: 0 }}>{left}</h2>
      {right}
    </div>
  );
}

function StatHero({ label, value, trend, testid }: { label: string; value: number | "…"; trend: { text: string; up: boolean | null } | null; testid: string }) {
  return (
    <Link
      href="/vendor/analytics"
      data-testid={testid}
      style={{
        background: "var(--color-forest)", color: "#f3f1ea",
        borderRadius: 14, padding: "16px 18px", textDecoration: "none",
        display: "flex", flexDirection: "column", gap: 4,
        boxShadow: "0 4px 14px rgba(15,42,29,.16)",
      }}
    >
      <span style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(243,241,234,.75)", display: "flex", alignItems: "center", gap: 6 }}>
        <Eye size={13} /> {label} <ArrowUpRight size={11} style={{ marginLeft: "auto", color: "var(--color-amber)" }} />
      </span>
      <span style={{ fontFamily: "var(--role-font-display)", fontSize: 36, fontWeight: 700, lineHeight: 1, marginTop: 5, color: "var(--color-amber)" }}>{value}</span>
      <TrendFoot trend={trend} onDark />
    </Link>
  );
}

function StatCompact({ label, icon, value, trend, testid }: { label: string; icon: React.ReactNode; value: number | "…"; trend: { text: string; up: boolean | null } | null; testid: string }) {
  return (
    <Link
      href="/vendor/analytics"
      data-testid={testid}
      style={{
        background: "var(--role-surface)", color: "var(--role-text)",
        border: "1px solid var(--role-border)", borderRadius: 14,
        padding: "14px 15px", textDecoration: "none",
        display: "flex", flexDirection: "column", gap: 4,
        boxShadow: "0 1px 4px rgba(15,42,29,.05)",
      }}
    >
      <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--role-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
        {icon} {label}
      </span>
      <span style={{ fontFamily: "var(--role-font-display)", fontSize: 25, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>{value}</span>
      <TrendFoot trend={trend} />
    </Link>
  );
}

function TrendFoot({ trend, onDark }: { trend: { text: string; up: boolean | null } | null; onDark?: boolean }) {
  if (!trend) return <span style={{ height: 15 }} />;
  return (
    <span style={{ fontSize: 11, marginTop: 6, display: "flex", alignItems: "center", gap: 4, color: onDark ? "rgba(243,241,234,.6)" : "var(--role-text-muted)" }}>
      {trend.up === true && <TrendingUp size={11} color="#7ec894" />}
      {trend.up === false && <Minus size={11} />}
      {trend.text}
    </span>
  );
}

function ListingCard({
  listing,
  metrics,
  isTop,
}: {
  listing: Props["listings"][number];
  metrics?: { views: number; saves: number };
  isTop: boolean;
}) {
  const isLive = listing.isPublished && listing.status === "active";
  const img = listing.images?.[0];
  return (
    <Link
      href={`/vendor/listings/${listing.id}/edit`}
      data-testid={`listing-card-${listing.id}`}
      style={{
        textDecoration: "none", color: "inherit",
        border: "1px solid var(--role-border)", borderRadius: 14,
        background: "var(--role-surface)", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 1px 4px rgba(15,42,29,.05)",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "4 / 3", background: "var(--color-amber-soft, rgba(232,163,61,.14))", display: "grid", placeItems: "center" }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={listing.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span aria-hidden style={{ fontFamily: "var(--role-font-display)", fontSize: 26, color: "var(--color-forest)" }}>🛍</span>
        )}
        <span style={{ position: "absolute", top: 9, left: 9, fontSize: 9.5, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 999, background: isLive ? "var(--color-forest)" : "var(--color-cream)", color: isLive ? "#f3f1ea" : "var(--role-text-muted)", border: isLive ? "none" : "1px solid var(--role-border)" }}>
          {isLive ? "Live" : "Draft"}
        </span>
        {isTop && (
          <span title="Top performer this week" style={{ position: "absolute", top: 9, right: 9, fontSize: 9.5, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 999, background: "var(--color-amber)", color: "var(--color-forest)" }}>
            ★ Top
          </span>
        )}
      </div>
      <div style={{ padding: "11px 13px 13px", display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
        <span style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>{listing.title}</span>
        <span style={{ fontFamily: "var(--role-font-display)", fontWeight: 700, fontSize: 15, color: "var(--color-forest)" }}>
          {PRICE(listing.priceMinMinor)}{listing.priceMaxMinor ? ` – ${PRICE(listing.priceMaxMinor)}` : ""}
        </span>
        <div style={{ display: "flex", gap: 10, marginTop: "auto", paddingTop: 7, borderTop: "1px dashed var(--role-border)", fontSize: 11.5, color: "var(--role-text-muted)" }}>
          {isLive && metrics ? (
            <>
              <span><b style={{ color: "var(--role-text)" }}>{metrics.views}</b> views</span>
              <span><b style={{ color: "var(--role-text)" }}>{metrics.saves}</b> saves</span>
            </>
          ) : (
            <span style={{ fontStyle: "italic" }}>{isLive ? "gathering data…" : "finish setting up"}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function TileLink({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "var(--role-surface)", border: "1px solid var(--role-border)",
        borderRadius: 12, padding: "12px 14px", textDecoration: "none", color: "inherit",
        boxShadow: "0 1px 4px rgba(15,42,29,.05)",
      }}
    >
      <span style={{ color: "var(--role-gold)", display: "grid", placeItems: "center" }}>{icon}</span>
      <span>
        <span style={{ display: "block", fontWeight: 600, fontSize: 13.5 }}>{title}</span>
        <span style={{ display: "block", fontSize: 11.5, color: "var(--role-text-muted)" }}>{desc}</span>
      </span>
    </Link>
  );
}
