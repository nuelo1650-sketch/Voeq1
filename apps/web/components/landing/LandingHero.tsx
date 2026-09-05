"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  UtensilsCrossed,
  Shirt,
  Laptop,
  Sparkles,
  BookOpen,
  ArrowRight,
} from "lucide-react";
// BUNDLE FIX (2026-09-05): seed taxonomy from the pure-data submodule —
// see components/explore/Filters.tsx for the full note. Root import would
// ship drizzle + neon crypto to the browser.
import { categories } from "@voeq/data/explore-view";

const CAT_ICONS: Record<string, React.ReactNode> = {
  "food-drinks": <UtensilsCrossed size={16} />,
  "fashion": <Shirt size={16} />,
  "tech-repairs": <Laptop size={16} />,
  "beauty-care": <Sparkles size={16} />,
  "academic-services": <BookOpen size={16} />,
};

/**
 * LandingHero — the emotional anchor (v5, founder-approved direction 2026-08-29).
 * Tagline "Find. Connect. Grow." is the hero. Search command-bar + category chips are
 * the TOOLS below it — fully wired to /explore. Living campus cards give the Voeq
 * personality. No fabricated numbers anywhere.
 */
export function LandingHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const goExplore = (q: string, cat: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.append("q", q.trim());
    if (cat !== "all") params.append("category", cat);
    const qs = params.toString();
    router.push(qs ? `/explore?${qs}` : "/explore");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    goExplore(query, selectedCategory);
  };

  return (
    <section className="hero">
      {/* Warm gradient + texture */}
      <div className="hero-bg" aria-hidden="true" />

      <div className="hero-inner">
        {/* LEFT — emotional anchor + tools */}
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-pulse" />
            <span className="hero-eyebrow-text">The campus marketplace</span>
          </div>

          <h1 className="hero-headline">
            Find. Connect.
            <span className="hero-headline-row2">
              <span className="hero-headline-accent">Grow.</span>
            </span>
          </h1>

          <p className="hero-subhead">
            Meet the marketplace that lives on your own campus — where you find
            things, people, and opportunities, all from students you know.
          </p>

          {/* Search command-bar — wired to /explore */}
          <form className="hero-search" onSubmit={handleSearch}>
            <Search size={18} className="hero-search-icon" aria-hidden="true" />
            <input
              className="hero-search-input"
              type="text"
              placeholder="What are you looking for?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search Voeq"
            />
            <select
              className="hero-search-cat"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <button className="hero-search-btn" type="submit">
              Search
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </form>

          {/* Category chips — wired to /explore?category=slug */}
          <div className="hero-chips">
            {categories.slice(0, 5).map((c) => (
              <button
                key={c.id}
                type="button"
                className="hero-chip"
                onClick={() => router.push(`/explore?category=${c.slug}`)}
              >
                <span className="hero-chip-icon">{CAT_ICONS[c.slug] ?? null}</span>
                <span>{c.name.replace(/ &.*$/, "")}</span>
              </button>
            ))}
          </div>

          {/* Primary CTA — unmissable path to Explore */}
          <button
            type="button"
            className="hero-cta-btn"
            onClick={() => router.push("/explore")}
          >
            Explore marketplace
            <ArrowRight size={17} aria-hidden="true" />
          </button>

          {/* Honest value props — no fake numbers */}
          <div className="hero-props">
            <span className="hero-prop">
              <span className="hero-prop-check">✓</span>
              <span><strong>Free</strong> to browse</span>
            </span>
            <span className="hero-prop">
              <span className="hero-prop-check">✓</span>
              <span><strong>Reviewed</strong> sellers</span>
            </span>
            <span className="hero-prop">
              <span className="hero-prop-check">✓</span>
              <span><strong>Local</strong> pickup on campus</span>
            </span>
          </div>
        </div>

        {/* RIGHT — living campus cards */}
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-card hero-card--1">
            <div className="hero-card-ic hero-card-ic--gold">
              <UtensilsCrossed size={20} />
            </div>
            <div className="hero-card-body">
              <h4>Suya spot</h4>
              <p>Nova Market · 2 min away</p>
            </div>
            <span className="hero-card-tag">Open</span>
          </div>
          <div className="hero-card hero-card--2">
            <div className="hero-card-ic hero-card-ic--forest">
              <BookOpen size={20} />
            </div>
            <div className="hero-card-body">
              <h4>Calculus tutor</h4>
              <p>Freelance · Book my slot</p>
            </div>
            <span className="hero-card-tag hero-card-tag--forest">Verified</span>
          </div>
          <div className="hero-card hero-card--3">
            <div className="hero-card-ic hero-card-ic--gold">
              <Shirt size={20} />
            </div>
            <div className="hero-card-body">
              <h4>Classic denim</h4>
              <p>Men's · Hostel B</p>
            </div>
            <span className="hero-card-tag">New</span>
          </div>
        </div>
      </div>
    </section>
  );
}
