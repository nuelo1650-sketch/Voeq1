"use client";

/**
 * CategoryPageMB (Money Bag B3) — /explore/c/[slug]: the calm catalog.
 *
 * Reuses the sections=1 payload filtered client-side to the category slug.
 * Honest counts; empty category = honest invitation. No fabrication (B7).
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ExploreListing } from "@voeq/data";
import { MbCard } from "./MbCard";

const CAT_NAMES: Record<string, string> = {
  "food-drinks": "Food & Drinks",
  fashion: "Fashion",
  "tech-repairs": "Tech & Repairs",
  "beauty-care": "Beauty & Care",
  "academic-services": "Academic",
  books: "Books",
  printing: "Printing",
  photography: "Photography",
  tailoring: "Tailoring",
  logistics: "Logistics",
  "home-essentials": "Home Essentials",
  "health-wellness": "Health & Wellness",
  groceries: "Groceries",
  tutorials: "Tutorials",
  rentals: "Rentals",
  events: "Events",
  "travel-transport": "Transport",
  "student-support": "Student Support",
  pastries: "Pastries & Bakes",
  drinks: "Drinks & Smoothies",
  skincare: "Skincare",
  fitness: "Fitness & Gains",
  hair: "Hair Services",
  gadgets: "Gadgets & Accessories",
  crafts: "Crafts & handmade",
  music: "Music & DJ",
  other: "Other",
};

export function CategoryPageMB({ campus }: { campus: string }) {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const name = CAT_NAMES[slug] ?? slug;

  const [data, setData] = useState<ExploreListing[] | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const q = new URLSearchParams({ campus, sections: "1" });
    let cancelled = false;
    fetch(`/api/explore?${q.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((res) => {
        if (cancelled) return;
        setData(res.data ?? []);
        setStatus("success");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [campus]);

  const listings = useMemo(
    () => (data ?? []).filter((l) => l.categorySlug === slug),
    [data, slug],
  );
  const total = data?.length ?? 0;

  return (
    <div data-testid="mb-category-page" style={{ minHeight: "100vh" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px var(--nav-inline-pad, 16px)", borderBottom: "1px solid var(--role-border)" }}>
        <Link href="/" aria-label="Voeq" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--role-font-display)", fontWeight: 800, fontSize: 22, color: "var(--forest-deep, #0F2A1D)" }}>
            voeq<span style={{ color: "var(--color-amber, #E8A33D)" }}>.</span>
          </span>
        </Link>
        <span style={{ fontSize: 13, color: "var(--role-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          Explore <span aria-hidden style={{ opacity: 0.5 }}>/</span> <b style={{ color: "var(--role-text)" }}>{name}</b>
        </span>
        <span style={{ flex: 1 }} />
        <Link href="/explore?next=mb" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--forest-deep, #0F2A1D)", textDecoration: "none", whiteSpace: "nowrap" }}>
          Full market →
        </Link>
      </header>

      <section style={{ background: "var(--forest-deep, #0F2A1D)", padding: "30px var(--nav-inline-pad, 16px) 26px", margin: "0 calc(-1 * var(--nav-inline-pad, 16px))" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(246,241,230,0.6)" }}>
            THE CATALOG
          </span>
          <h1 style={{ margin: "10px 0 0", fontFamily: "var(--role-font-display)", fontSize: "clamp(26px, 6vw, 40px)", color: "#f6f1e6", fontWeight: 900 }}>
            {name}
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: "rgba(246,241,230,0.75)" }}>
            {status === "success"
              ? `${listings.length} of ${total} listing${total === 1 ? "" : "s"} on the market`
              : "…"}
          </p>
        </div>
      </section>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "22px var(--nav-inline-pad, 16px) 50px" }}>
        {status === "loading" && (
          <div data-testid="mb-cat-loading" style={{ padding: "40px 0", textAlign: "center", color: "var(--role-muted)", fontSize: 14 }}>
            Opening the catalog…
          </div>
        )}
        {status === "error" && (
          <div data-testid="mb-cat-error" role="alert" style={{ padding: "40px 0", textAlign: "center" }}>
            <p style={{ fontWeight: 600, color: "var(--role-text)" }}>The catalog is unreachable right now.</p>
            <button onClick={() => window.location.reload()} style={{ border: "1px solid var(--role-border)", background: "var(--role-surface)", borderRadius: 999, padding: "8px 18px", cursor: "pointer", fontWeight: 600 }}>
              Try again
            </button>
          </div>
        )}
        {status === "success" && listings.length === 0 && (
          <div data-testid="mb-cat-empty" style={{ padding: "44px 22px", border: "1.5px dashed var(--role-border)", borderRadius: 20, textAlign: "center" }}>
            <p style={{ margin: 0, fontFamily: "var(--role-font-display)", fontSize: 20, color: "var(--forest-deep, #0F2A1D)" }}>
              Nothing here yet
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--role-muted)" }}>
              The {name.toLowerCase()} shelf is waiting for its first listing.
            </p>
            <Link href="/become-vendor" style={{ display: "inline-flex", marginTop: 14, background: "var(--forest-deep, #0F2A1D)", color: "#f6f1e6", borderRadius: 999, padding: "10px 20px", fontSize: 13.5, fontWeight: 700, textDecoration: "none" }}>
              Be the first
            </Link>
          </div>
        )}
        {listings.length > 0 && (
          <div data-testid="mb-cat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            {listings.map((l, i) => (
              <MbCard key={l.id} listing={l} revealDelay={(i % 4) * 100} eager={i < 2} />
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", padding: "30px 0 10px" }}>
          <Link href="/explore?next=mb" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 999, border: "1.5px dashed rgba(15,42,29,0.3)", color: "var(--forest-deep, #0F2A1D)", fontWeight: 700, fontSize: 13.5, textDecoration: "none", background: "rgba(255,255,255,0.5)" }}>
            ← Back to the full market
          </Link>
        </div>
      </main>
    </div>
  );
}
