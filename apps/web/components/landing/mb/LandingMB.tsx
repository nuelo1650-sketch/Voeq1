"use client";

/**
 * LandingMB (Money Bag C1) — the composed advertisement landing behind
 * ?next=mb. Sections (home-v7): Nav v7 → Hero + polaroid collage → sand
 * trust band → Fresh drops (B1 component reuse) → Vendor Spotlight →
 * On the grid today → What is Voeq? + vendor panel → Areas band (B3 links)
 * → ExploreDoor (upgraded A10) → existing footer (SmartFooter handles).
 *
 * Data: ONE /api/explore?sections=1 request feeds collage, drops, grid,
 * spotlight, door counts. Honesty (B7/B10): no stats numbers, no sold
 * claims, ratings only when real, empty sections collapse.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ExploreListing } from "@voeq/data";
import { LandingNavMB } from "./LandingNavMB";
import { LandingHeroMB } from "./LandingHeroMB";
import { TrustBandMB } from "./TrustBandMB";
import { FreshDrops } from "@/components/explore/mb/FreshDrops";
import { VendorSpotlightMB } from "./VendorSpotlightMB";
import { MbCard } from "@/components/explore/mb/MbCard";
import { ExploreDoor } from "./ExploreDoor";

const AREA_LINKS = [
  { id: "delta-okerenkoko", label: "Okerenkoko" },
  { id: "delta-warri", label: "Warri" },
  { id: "edo-benin-city", label: "Benin City" },
  { id: "rivers-port-harcourt", label: "Port Harcourt" },
  { id: "lagos-ikeja", label: "Ikeja" },
];

const EXPLAIN_ROWS = [
  {
    n: "01",
    title: "Find it",
    body: "Search the market or browse stalls by category. Every vendor is campus-verified — real people, real businesses, no guesswork.",
  },
  {
    n: "02",
    title: "Chat it",
    body: "Message vendors right here on Voeq. Ask questions, agree a price, agree where to meet — no WhatsApp juggling.",
  },
  {
    n: "03",
    title: "Get it",
    body: "Meet on campus or get it delivered. You pay when you're happy — that's how a trusted market works.",
  },
];

export function LandingMB({ campusName }: { campusName: string }) {
  const [listings, setListings] = useState<ExploreListing[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const q = new URLSearchParams({ sections: "1" });
    let cancelled = false;
    fetch(`/api/explore?${q.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((res) => {
        if (cancelled) return;
        setListings(res.data ?? []);
        setStatus("success");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  const grid = listings.slice(0, 8);
  const categoryCount = new Set(listings.map((l) => l.categorySlug ?? "other")).size;

  return (
    <div data-testid="mb-landing" style={{ minHeight: "100vh", background: "var(--role-surface, #F5F1E8)" }}>
      <LandingNavMB />

      <main className="landing-page">
        <LandingHeroMB listings={status === "success" ? listings : []} />
        <TrustBandMB campusName={campusName} />

        {/* Fresh drops — forest band (B1 component, same data) */}
        <div style={{ margin: "10px 0 0" }}>
          <FreshDrops drops={listings.filter((l) => l.createdAt && Date.now() - new Date(l.createdAt).getTime() < 72 * 3600 * 1000).slice(0, 6)} />
        </div>

        <VendorSpotlightMB listings={status === "success" ? listings : []} />

        {/* On the grid today — fair-share slice (A8) */}
        {grid.length > 0 && (
          <section data-testid="mb-landing-grid" style={{ padding: "32px 16px 4px", maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 15, gap: 10 }}>
              <h2 style={{ margin: 0, fontFamily: "var(--role-font-display)", fontSize: "clamp(21px, 4.6vw, 28px)", fontWeight: 900, color: "var(--forest-deep, #0F2A1D)" }}>
                On the grid today
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 500, color: "var(--role-muted, #4A4A4A)", fontFamily: "Inter, system-ui, sans-serif", marginTop: 4 }}>
                  A fair rotation — every listing gets time on the floor
                </span>
              </h2>
              <Link href="/explore?next=mb" style={{ fontSize: 13, fontWeight: 700, color: "var(--amber-dark, #D4922A)", whiteSpace: "nowrap", textDecoration: "none" }}>
                More →
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 13 }}>
              {grid.map((l, i) => (
                <MbCard key={l.id} listing={l} revealDelay={(i % 4) * 100} eager={i < 2} />
              ))}
            </div>
          </section>
        )}

        {/* What is Voeq? + vendor panel (A9) */}
        <div style={{ background: "var(--sand, #EFE7D3)", marginTop: 32, padding: "34px 0 38px", borderTop: "1px solid rgba(15,42,29,0.06)", borderBottom: "1px solid rgba(15,42,29,0.06)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
            <div style={{ maxWidth: "46ch", marginBottom: 22 }}>
              <h2 style={{ fontFamily: "var(--role-font-display)", fontWeight: 900, color: "var(--forest-deep, #0F2A1D)", fontSize: "clamp(24px, 5vw, 30px)", lineHeight: 1.1, margin: 0 }}>
                What is Voeq?
              </h2>
              <p style={{ color: "var(--role-muted, #4A4A4A)", fontSize: 14.5, lineHeight: 1.6, marginTop: 8 }}>
                The market for Nigerian students — a place to discover who sells what around you, talk to them directly, and get it without wahala. Built for campuses, open to every corner of Nigeria.
              </p>
            </div>
            <div>
              {EXPLAIN_ROWS.map((r) => (
                <div key={r.n} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "15px 2px", borderTop: "1px solid rgba(15,42,29,0.1)" }}>
                  <span style={{ fontFamily: "var(--role-font-display)", fontWeight: 900, color: "var(--amber-dark, #D4922A)", fontSize: 17, flex: "0 0 30px" }}>{r.n}</span>
                  <span>
                    <b style={{ display: "block", fontSize: 15, color: "var(--forest-deep, #0F2A1D)", fontWeight: 800, marginBottom: 3 }}>{r.title}</b>
                    <p style={{ fontSize: 13.5, color: "var(--role-muted, #4A4A4A)", lineHeight: 1.55, margin: 0, maxWidth: "56ch" }}>{r.body}</p>
                  </span>
                </div>
              ))}
            </div>

            <div
              data-testid="mb-vendor-panel"
              style={{
                background: "var(--forest-deep, #0F2A1D)",
                borderRadius: 22,
                padding: "26px 20px",
                color: "#f6f1e6",
                position: "relative",
                overflow: "hidden",
                marginTop: 26,
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: "-45%",
                  right: "-25%",
                  width: "70%",
                  aspectRatio: "1",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(232,163,61,0.2), transparent 70%)",
                }}
              />
              <p style={{ fontSize: 10, letterSpacing: "0.2em", fontWeight: 800, color: "var(--amber-light, #F5C36A)", textTransform: "uppercase", margin: 0, position: "relative" }}>
                FOR VENDORS
              </p>
              <h3 style={{ fontFamily: "var(--role-font-display)", fontWeight: 900, fontSize: "clamp(24px, 5vw, 32px)", lineHeight: 1.06, margin: "10px 0 8px", position: "relative" }}>
                Your stall opens in <em style={{ fontStyle: "italic", color: "var(--color-amber, #E8A33D)" }}>minutes.</em>
              </h3>
              <p style={{ fontSize: 14, color: "rgba(250,246,236,0.78)", lineHeight: 1.55, maxWidth: "46ch", position: "relative", margin: 0 }}>
                List what you sell, chat with buyers, meet on campus. You set your prices — we never take a cut of meet-up sales.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, margin: "20px 0", position: "relative" }}>
                {[
                  ["Create your free account", "Email or Google — under a minute."],
                  ["List your products", "Photos, price, done. Edit any time."],
                  ["Chat and hand over", "Agree in the app, meet on campus safely."],
                ].map(([t, s], i) => (
                  <div key={t} style={{ display: "flex", gap: 11, alignItems: "flex-start", background: "rgba(250,246,236,0.06)", border: "1px solid rgba(250,246,236,0.12)", borderRadius: 14, padding: "12px 14px" }}>
                    <span aria-hidden style={{ flex: "0 0 26px", width: 26, height: 26, borderRadius: 999, background: "var(--color-amber, #E8A33D)", color: "var(--forest-deep, #0F2A1D)", fontWeight: 900, fontSize: 13, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      {i + 1}
                    </span>
                    <span>
                      <b style={{ display: "block", fontSize: 14 }}>{t}</b>
                      <p style={{ fontSize: 12, color: "rgba(250,246,236,0.7)", lineHeight: 1.45, margin: "1px 0 0" }}>{s}</p>
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", position: "relative" }}>
                {/* intent=vendor on every vendor path (D5) */}
                <Link
                  href="/become-vendor?intent=vendor"
                  data-testid="mb-vendor-cta"
                  style={{ background: "var(--color-amber, #E8A33D)", color: "var(--forest-deep, #0F2A1D)", borderRadius: 999, padding: "13px 24px", fontWeight: 800, fontSize: 14.5, textDecoration: "none" }}
                >
                  Become a vendor
                </Link>
                <Link href="/how-it-works" style={{ border: "1.5px solid rgba(250,246,236,0.4)", color: "#f6f1e6", borderRadius: 999, padding: "13px 20px", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                  How it works
                </Link>
              </div>
              <p style={{ fontSize: 11.5, color: "rgba(250,246,236,0.55)", marginTop: 12, position: "relative" }}>
                No listing fees · no commission on meet-up sales · you set your prices.
              </p>
            </div>
          </div>
        </div>

        {/* Areas band — real B3 links (A20-slim) */}
        {status === "success" && (
          <section data-testid="mb-areas-band" style={{ maxWidth: 1200, margin: "30px auto 0", padding: "0 16px" }}>
            <h2 style={{ fontFamily: "var(--role-font-display)", fontWeight: 900, fontSize: "clamp(21px, 4.6vw, 28px)", color: "var(--forest-deep, #0F2A1D)", margin: "0 0 6px" }}>
              Beyond the campus gates
            </h2>
            <p style={{ margin: "0 0 14px", fontSize: 14, color: "var(--role-muted, #4A4A4A)" }}>
              Vendors everywhere in Nigeria — not just on campus. Browse by area, see how close they are.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {AREA_LINKS.map((a) => (
                <Link
                  key={a.id}
                  href={`/explore/areas/${a.id}`}
                  data-testid="mb-area-chip"
                  style={{ border: "1px solid rgba(15,42,29,0.18)", background: "#fff", borderRadius: 999, padding: "9px 16px", fontSize: 13.5, fontWeight: 700, color: "var(--forest-deep, #0F2A1D)", textDecoration: "none" }}
                >
                  {a.label}
                </Link>
              ))}
              <Link
                href="/explore?next=mb"
                style={{ border: "1px dashed rgba(15,42,29,0.3)", borderRadius: 999, padding: "9px 16px", fontSize: 13.5, fontWeight: 800, color: "var(--forest-deep, #0F2A1D)", textDecoration: "none", background: "rgba(255,255,255,0.5)" }}
              >
                All 36 states →
              </Link>
            </div>
          </section>
        )}

        {/* THE EXPLORE DOOR — upgraded (founder: "do them well and better") */}
        <ExploreDoor listings={status === "success" ? listings : []} categories={categoryCount} areas={37} />

        <div style={{ height: 36 }} />
      </main>
      {/* Footer: SmartFooter (root layout) renders the existing landing footer here. */}
    </div>
  );
}
