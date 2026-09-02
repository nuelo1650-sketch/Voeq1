import { redirect } from "next/navigation";
import { getStaffIdentity } from "@/lib/session";
import {
  mockVendorRepo,
  mockListingsRepo,
  mockIdentityRepo,
  mockReviewRepo,
  mockMessageRepo,
  mockReportRepo,
  mockStaffRepo,
  mockPageEventStore,
  queryAudit,
  categories,
  ROLE_CAPABILITIES,
  type StaffRole,
  type Review,
  type Message,
  type Report,
  type Identity,
  type Vendor,
  type Listing,
} from "@voeq/data";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

/**
 * K3c.7 — Admin analytics page (P-A round 59).
 *
 * Real counts only. Date-range filtered (7/30/90/all); time-series trends
 * (signups, listings, messages, reviews, reports) computed from REAL
 * row timestamps — listings-created uses audit events (vendor.listing.create)
 * because listings rows carry no created_at. No fabricated data, ever.
 */

type RangeKey = "7" | "30" | "90" | "all";

function parseRange(key: string | null): { label: string; since: number } {
  const k = (key as RangeKey) || "30";
  const map: Record<RangeKey, { label: string; since: number }> = {
    "7": { label: "Last 7 days", since: 7 * 86400_000 },
    "30": { label: "Last 30 days", since: 30 * 86400_000 },
    "90": { label: "Last 90 days", since: 90 * 86400_000 },
    all: { label: "All time", since: 0 },
  };
  return map[k] ?? map["30"];
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "unknown" : d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

/** Bucket [ISO-createdAt rows] into per-day counts for the visible window. */
function trendByDay(
  items: Array<{ createdAt: string | null }>,
  since: number,
  now: number,
  allTime: boolean,
): Array<{ label: string; count: number }> {
  const days = allTime ? 30 : Math.ceil(Math.min((now - since) / 86400_000, 30));
  const buckets = Array.from({ length: days }, (_, i) => {
    const dayStart = allTime ? now - (days - 1 - i) * 86400_000 : since + i * 86400_000;
    return { label: fmtDate(new Date(dayStart).toISOString()), count: 0 };
  });
  for (const it of items) {
    if (!it.createdAt) continue;
    const t = new Date(it.createdAt).getTime();
    if (!Number.isFinite(t) || (!allTime && t < since) || t > now) continue;
    const idx = allTime ? Math.max(0, Math.min(days - 1, Math.floor((t - (now - days * 86400_000)) / 86400_000))) : Math.floor((t - since) / 86400_000);
    if (idx >= 0 && idx < days) buckets[idx].count++;
  }
  return buckets;
}

function sumTrend(t: Array<{ count: number }>): number {
  return t.reduce((s, b) => s + b.count, 0);
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const staff = await getStaffIdentity();
  if (!staff) redirect("/login?next=/staff/analytics");

  const caps = ROLE_CAPABILITIES[staff.staffRole as StaffRole];
  if (!caps.includes("analytics.read")) redirect("/staff");

  const { range } = await searchParams;
  const { label, since } = parseRange(range ?? null);
  const now = Date.now();
  const allTime = since === 0;

  // Real data — everything from the DB.
  const [allVendors, allListings, allIdentities, allReviews, allMessages, allReports, allCases, audit, events] =
    await Promise.all([
      mockVendorRepo.listVendors(),
      mockListingsRepo.list({}),
      mockIdentityRepo.list(),
      mockReviewRepo.listAll(),
      mockMessageRepo.listAll(),
      mockReportRepo.list(),
      mockStaffRepo.listCases(""),
      queryAudit({ limit: 250 }),
      mockPageEventStore.query({ limit: 5000 }),
    ]);

  // ---- KPI cards ----
  // RANGE-scoped where rows carry timestamps (identities/messages/reviews/
  // reports all have createdAt). Vendors + listings have NO createdAt column,
  // so those cards show honest TABLE totals (and the audit-based "created in
  // range" shows under Trends' activity; the audit log only began persisting
  // to the DB at round 59, so historical creation events don't exist).
  const signups = allIdentities.filter((i: Identity) => allTime || new Date(i.createdAt).getTime() >= since);
  const msgsInRange = allMessages.filter((m: Message) => allTime || new Date(m.createdAt).getTime() >= since);
  const reviewsInRange = allReviews.filter((r: Review) => allTime || new Date(r.createdAt).getTime() >= since);
  const reportsInRange = allReports.filter((r: Report) => allTime || new Date(r.createdAt).getTime() >= since);
  const openCases = allCases.filter((c) => c.status === "open" || c.status === "triaged");

  // ---- Time-series trends ----
  const signupTrend = trendByDay(allIdentities, since, now, allTime);
  const msgTrend = trendByDay(allMessages, since, now, allTime);
  const reviewTrend = trendByDay(allReviews, since, now, allTime);
  const reportTrend = trendByDay(allReports, since, now, allTime);
  const listingTrend = trendByDay(
    audit.filter((e) => e.type === "vendor.listing.create").map((e) => ({ createdAt: e.at })),
    since,
    now,
    allTime,
  );

  // ---- Distribution: campus + category ----
  const campusSet = new Map<string, string>();
  const campusList = await (await import("@voeq/data")).mockCampusRepo.list();
  for (const c of campusList) campusSet.set(c.id, c.name);
  const campusDist = [...campusSet.entries()].map(([id, name]) => ({
    name,
    vendors: allVendors.filter((v: Vendor) => v.campus === id).length,
    listings: allListings.filter((l: Listing) => {
      const v = allVendors.find((x: Vendor) => x.id === l.vendorId);
      return v?.campus === id;
    }).length,
  })).filter((r) => r.vendors > 0 || r.listings > 0);

  const catDist = categories
    .map((c) => ({
      name: c.name,
      count: allListings.filter((l: Listing) => l.categoryId === c.id).length,
    }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  // ---- Vendor leaderboard (ratings + engagement) ----
  const leaderboard = allVendors
    .map((v: Vendor) => {
      const revs = allReviews.filter((r: Review) => r.vendorId === v.id);
      const avg = revs.length ? revs.reduce((s, r) => s + (r.rating ?? 0), 0) / revs.length : 0;
      const msgs = allMessages.filter((m: Message) => m.senderId === v.id || (m as Message).conversationId?.startsWith(v.id)).length;
      return { name: v.name, campus: campusSet.get(v.campus ?? "") ?? v.campus, reviews: revs.length, avg: Math.round(avg * 10) / 10, msgs };
    })
    .sort((a, b) => b.reviews - a.reviews || b.avg - a.avg)
    .slice(0, 8);

  // ---- Recent activity (audit, non-PII) ----
  const recentActivity = audit.slice(0, 12).map((e) => ({
    type: e.type,
    at: fmtDate(e.at),
  }));

  const maxTrend = (t: Array<{ count: number }>) => Math.max(1, ...t.map((b) => b.count));

  // ---- P-A round 60: TRAFFIC (from page_events) ----
  const eventsInRange = events.filter((e) => allTime || new Date(e.at).getTime() >= since);
  // Unique auth'd visitors in range (by identity id) — "who visited" without PII.
  const uniqueVisitors = new Set(eventsInRange.filter((e) => e.identityId).map((e) => e.identityId as string)).size;
  const eventByType = new Map<string, number>();
  const platformByType = new Map<string, number>();
  for (const e of eventsInRange) {
    eventByType.set(e.type, (eventByType.get(e.type) ?? 0) + 1);
    platformByType.set(e.platform ?? "unknown", (platformByType.get(e.platform ?? "unknown") ?? 0) + 1);
  }
  const eventBreakdown = [...eventByType.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  const trafficTrend = trendByDay(
    eventsInRange.map((e) => ({ createdAt: e.at })),
    since,
    now,
    allTime,
  );
  // Top viewed listings (by listing_view events) — the honest popularity signal.
  const topViewed = new Map<string, number>();
  for (const e of eventsInRange) {
    if (e.type === "listing_view" && e.refId) topViewed.set(e.refId, (topViewed.get(e.refId) ?? 0) + 1);
  }
  const topListings = [...topViewed.entries()]
    .map(([id, count]) => ({
      id,
      title: allListings.find((l: Listing) => l.id === id)?.title ?? "—",
      vendor: allListings.find((l: Listing) => l.id === id)?.vendorId ?? "",
      views: count,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  return (
    <AppShell role="staff" userName={staff.email}>
      <div style={{ minHeight: "100vh", background: "var(--role-surface-sunken)", padding: "var(--space-4)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Link href="/staff" style={{ fontSize: 14, color: "var(--role-accent)", textDecoration: "none", marginBottom: 12, display: "inline-block" }}>
            ← Back to dashboard
          </Link>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: 0, color: "var(--role-text)", fontWeight: 700 }}>
                Platform Analytics
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--role-text-muted)" }}>
                Real metrics, date-filtered · showing: {label}
              </p>
            </div>
            {/* Date range filter */}
            <div role="group" aria-label="Date range" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {([["7", "7d"], ["30", "30d"], ["90", "90d"], ["all", "All"]] as const).map(([k, t]) => {
                const active = (range ?? "30") === k;
                return (
                  <Link
                    key={k}
                    href={`/staff/analytics?range=${k}`}
                    data-testid={`analytics-range-${k}`}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                      fontFamily: "var(--role-font-ui)",
                      background: active ? "var(--role-accent)" : "var(--role-surface)",
                      color: active ? "var(--role-surface)" : "var(--role-text-muted)",
                      border: `1px solid ${active ? "transparent" : "var(--role-border)"}`,
                    }}
                  >
                    {t}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, margin: "24px 0" }}>
            <MetricCard label={`Users · ${label}`} value={signups.length} />
            <MetricCard label={`Vendors (total)`} value={allVendors.length} />
            <MetricCard label={`Listings (total)`} value={allListings.length} />
            <MetricCard label={`Messages · ${label}`} value={msgsInRange.length} />
            <MetricCard label={`Reviews · ${label}`} value={reviewsInRange.length} />
            <MetricCard label={`Reports · ${label}`} value={reportsInRange.length} />
            <MetricCard label="Open cases" value={openCases.length} accent />
          </div>

          {/* P-A round 60: TRAFFIC — real views/clicks from page_events */}
          <section style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 8, padding: 24, marginBottom: 24 }} data-testid="traffic-section">
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "var(--role-text)" }}>Traffic & Activity</h2>
              <span style={{ fontSize: 13, color: "var(--role-text-muted)" }}>
                {eventsInRange.length} events · {uniqueVisitors} unique signed-in visitors · {label}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, marginTop: 16 }}>
              <div>
                <TrendChart title="All activity per day" data={trafficTrend} max={maxTrend(trafficTrend)} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                  {eventBreakdown.map((b) => (
                    <span key={b.type} data-testid={`event-${b.type}`} style={{
                      fontSize: 12, padding: "4px 10px", borderRadius: 999,
                      background: "var(--role-surface-sunken)", color: "var(--role-text-muted)",
                      fontFamily: "var(--role-font-ui)", fontWeight: 600,
                    }}>
                      {b.type} · {b.count}
                    </span>
                  ))}
                  {eventBreakdown.length === 0 && (
                    <span style={{ fontSize: 13, color: "var(--role-text-muted)" }}>No events yet — tracking is live and fills as users browse.</span>
                  )}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 10px", color: "var(--role-text)" }}>Top viewed listings</h3>
                {topListings.length === 0 ? (
                  <p style={{ fontSize: 13, color: "var(--role-text-muted)" }}>No listing views recorded yet.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {topListings.map((l) => (
                        <tr key={l.id} style={{ borderBottom: "1px solid var(--role-surface-sunken)" }}>
                          <td style={{ padding: "8px 0", fontSize: 14, color: "var(--role-text)" }}>{l.title}</td>
                          <td style={{ padding: "8px 0", fontSize: 14, color: "var(--role-accent)", textAlign: "right", fontWeight: 700 }}>{l.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "14px 0 6px", color: "var(--role-text)" }}>Platforms</h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[...platformByType.entries()].map(([p, c]) => (
                    <span key={p} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, background: "var(--role-surface-sunken)", color: "var(--role-text-muted)" }}>
                      {p} · {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Time-series */}
          <section style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 8, padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", color: "var(--role-text)" }}>Trends (per day)</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
              <TrendChart title="Signups" data={signupTrend} max={maxTrend(signupTrend)} />
              <TrendChart title="Listings created" data={listingTrend} max={maxTrend(listingTrend)} />
              <TrendChart title="Messages sent" data={msgTrend} max={maxTrend(msgTrend)} />
              <TrendChart title="Reviews" data={reviewTrend} max={maxTrend(reviewTrend)} />
              <TrendChart title="Reports" data={reportTrend} max={maxTrend(reportTrend)} />
            </div>
          </section>

          {/* Distribution */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24, marginBottom: 24 }}>
            {/* Campus */}
            <section style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 8, padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", color: "var(--role-text)" }}>Campus Distribution</h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--role-border)" }}>
                    <th style={{ textAlign: "left", padding: 12, fontSize: 12, fontWeight: 600, color: "var(--role-text-muted)", textTransform: "uppercase" }}>Campus</th>
                    <th style={{ textAlign: "right", padding: 12, fontSize: 12, fontWeight: 600, color: "var(--role-text-muted)", textTransform: "uppercase" }}>Vendors</th>
                    <th style={{ textAlign: "right", padding: 12, fontSize: 12, fontWeight: 600, color: "var(--role-text-muted)", textTransform: "uppercase" }}>Listings</th>
                  </tr>
                </thead>
                <tbody>
                  {campusDist.map((campus) => (
                    <tr key={campus.name} style={{ borderBottom: "1px solid var(--role-border)" }}>
                      <td style={{ padding: 12, fontSize: 14, color: "var(--role-text)" }}>{campus.name}</td>
                      <td style={{ padding: 12, fontSize: 14, color: "var(--role-text)", textAlign: "right" }}>{campus.vendors}</td>
                      <td style={{ padding: 12, fontSize: 14, color: "var(--role-text)", textAlign: "right" }}>{campus.listings}</td>
                    </tr>
                  ))}
                  {campusDist.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: 12, color: "var(--role-text-muted)" }}>No campus data yet.</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* Categories */}
            <section style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 8, padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", color: "var(--role-text)" }}>Top Categories</h2>
              {catDist.length === 0 ? (
                <p style={{ color: "var(--role-text-muted)", fontSize: 14 }}>No listings yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {catDist.map((c) => {
                    const pct = Math.round((c.count / allListings.length) * 100);
                    return (
                      <div key={c.name}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--role-text)", marginBottom: 4 }}>
                          <span>{c.name}</span><span style={{ color: "var(--role-text-muted)" }}>{c.count} · {pct}%</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 999, background: "var(--role-surface-sunken)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "var(--role-accent)", borderRadius: 999 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Vendor leaderboard + activity */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24, marginBottom: 24 }}>
            <section style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 8, padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", color: "var(--role-text)" }}>Vendor Leaderboard</h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--role-border)" }}>
                    <th style={{ textAlign: "left", padding: 10, fontSize: 12, fontWeight: 600, color: "var(--role-text-muted)", textTransform: "uppercase" }}>Vendor</th>
                    <th style={{ textAlign: "right", padding: 10, fontSize: 12, fontWeight: 600, color: "var(--role-text-muted)", textTransform: "uppercase" }}>Avg ★</th>
                    <th style={{ textAlign: "right", padding: 10, fontSize: 12, fontWeight: 600, color: "var(--role-text-muted)", textTransform: "uppercase" }}>Reviews</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((v) => (
                    <tr key={v.name} style={{ borderBottom: "1px solid var(--role-border)" }}>
                      <td style={{ padding: 10, fontSize: 14, color: "var(--role-text)" }}>{v.name}</td>
                      <td style={{ padding: 10, fontSize: 14, color: "var(--role-accent)", textAlign: "right" }}>{v.avg || "—"}</td>
                      <td style={{ padding: 10, fontSize: 14, color: "var(--role-text)", textAlign: "right" }}>{v.reviews}</td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: 12, color: "var(--role-text-muted)" }}>No vendors yet.</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            <section style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 8, padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", color: "var(--role-text)" }}>Recent Activity</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentActivity.length === 0 && <p style={{ color: "var(--role-text-muted)", fontSize: 14 }}>No events yet.</p>}
                {recentActivity.map((a, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--role-text)", borderBottom: "1px dashed var(--role-border)", paddingBottom: 6 }}>
                    <span style={{ fontFamily: "var(--role-font-ui)" }}>{a.type}</span>
                    <span style={{ color: "var(--role-text-muted)" }}>{a.at}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div data-testid={`metric-${label.split("·")[0].trim().toLowerCase().replace(/\s+/g, "-")}`} style={{ background: "var(--role-surface)", border: `1px solid ${accent ? "var(--role-accent)" : "var(--role-border)"}`, borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent ? "var(--role-accent)" : "var(--role-accent)", fontFamily: "var(--font-display)", marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--role-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
    </div>
  );
}

function TrendChart({ title, data, max }: { title: string; data: Array<{ label: string; count: number }>; max: number }) {
  return (
    <div data-testid={`trend-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--role-text)" }}>{title}</span>
        <span style={{ fontSize: 14, color: "var(--role-accent)", fontWeight: 700 }}>{sumTrend(data)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 90 }}>
        {data.map((b, i) => (
          <div
            key={i}
            title={`${b.label}: ${b.count}`}
            style={{
              flex: 1,
              height: `${Math.max(3, (b.count / max) * 100)}%`,
              background: b.count ? "var(--role-accent)" : "var(--role-surface-sunken)",
              borderRadius: "3px 3px 0 0",
              minWidth: 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
