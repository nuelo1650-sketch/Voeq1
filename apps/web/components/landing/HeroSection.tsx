"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, UtensilsCrossed, Shirt, Laptop, Sparkles, BookOpen, ChevronRight, ArrowRight } from "lucide-react";
import { mockCampusRepo, type Campus } from "@voeq/data";
import { categories } from "@voeq/data";

const CAT_ICONS: Record<string, React.ReactNode> = {
  "food-drinks": <UtensilsCrossed size={14} />,
  fashion: <Shirt size={14} />,
  "tech-repairs": <Laptop size={14} />,
  "beauty-care": <Sparkles size={14} />,
  "academic-services": <BookOpen size={14} />,
};

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [animated, setAnimated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAnimated(true);
    mockCampusRepo.list().then((rows) => {
      setCampuses(rows.filter((c) => c.status === "verified"));
    });
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append("q", searchQuery);
    if (selectedCategory !== "all") params.append("category", selectedCategory);
    router.push(params.toString() ? `/explore?${params.toString()}` : "/explore");
  };

  const scrollCategories = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -120 : 120;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className="hero-section">
      {/* Background texture + gradient */}
      <div className="hero-bg" />

      <div className="hero-content">
        {/* Eyebrow with gold dot */}
        <div className={`hero-eyebrow ${animated ? "hero-eyebrow--in" : ""}`}>
          <span className="hero-eyebrow-dot" />
          <span>your campus, in motion</span>
        </div>

        {/* Kinetic headline */}
        <div className="hero-headline-wrap">
          <h1 className="hero-headline" aria-label="Find. Connect. Grow.">
            <span
              className={`hero-word ${animated ? "hero-word--in" : ""}`}
              style={{ animationDelay: "0.4s" }}
            >
              Find.
            </span>{" "}
            <span
              className={`hero-word ${animated ? "hero-word--in" : ""}`}
              style={{ animationDelay: "0.95s" }}
            >
              Connect.
            </span>
            <br />
            <span
              className={`hero-word hero-word--grow ${animated ? "hero-word--in" : ""}`}
              style={{ animationDelay: "1.5s" }}
            >
              Grow.
            </span>
            <span
              className={`hero-underline ${animated ? "hero-underline--in" : ""}`}
              style={{ animationDelay: "2.05s" }}
              aria-hidden="true"
            />
          </h1>
          {/* Tracer dot */}
          <span
            className={`hero-tracer ${animated ? "hero-tracer--in" : ""}`}
            style={{ animationDelay: "0.3s" }}
            aria-hidden="true"
          />
        </div>

        {/* Subheadline */}
        <p
          className={`hero-subheadline ${animated ? "hero-subheadline--in" : ""}`}
          style={{ animationDelay: "2.25s" }}
        >
          The campus marketplace for Nigerian students — discover vendors, services, and hand-me-downs from people on your own campus.
        </p>

        {/* Search bar — single pill */}
        <form
          onSubmit={handleSearch}
          className={`hero-search-bar ${animated ? "hero-search-bar--in" : ""}`}
          style={{ animationDelay: "2.5s" }}
        >
          <Search size={18} className="hero-search-icon" />
          <input
            type="text"
            placeholder="What are you looking for?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="hero-search-input"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="hero-search-select"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <button type="submit" className="hero-search-btn">
            <span className="hero-search-btn-text">Search</span>
            <ChevronRight size={18} className="hero-search-btn-icon" />
          </button>
        </form>

        {/* Category pills — scrollable */}
        <div
          className={`hero-pills-wrapper ${animated ? "hero-pills-wrapper--in" : ""}`}
          style={{ animationDelay: "2.65s" }}
        >
          <button
            onClick={() => scrollCategories("left")}
            className="hero-pill-scroll hero-pill-scroll--left"
            aria-label="Scroll categories left"
          >
            <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
          </button>
          <div className="hero-pills" ref={scrollRef}>
            <button
              className={`hero-pill ${selectedCategory === "all" ? "hero-pill--active" : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              Everything
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`hero-pill ${selectedCategory === cat.slug ? "hero-pill--active" : ""}`}
                onClick={() => setSelectedCategory(cat.slug)}
              >
                {CAT_ICONS[cat.slug]}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => scrollCategories("right")}
            className="hero-pill-scroll hero-pill-scroll--right"
            aria-label="Scroll categories right"
          >
            <ArrowRight size={14} />
          </button>
        </div>

        {/* CTA buttons */}
        <div
          className={`hero-ctas ${animated ? "hero-ctas--in" : ""}`}
          style={{ animationDelay: "2.8s" }}
        >
          <Link href="/explore" className="btn-primary btn-lg hero-cta-primary">
            <span>Explore marketplace</span>
            <ArrowRight size={18} />
          </Link>
          <Link href="/for-vendors" className="btn-ghost btn-lg">
            Become a vendor
          </Link>
        </div>
      </div>

      {/* Right column — campus roll-call (desktop only) */}
      {campuses.length > 0 && (
        <div
          className={`hero-right-col ${animated ? "hero-right-col--in" : ""}`}
          style={{ animationDelay: "2.9s" }}
        >
          <div className="hero-campus-roll">
            <p className="hero-campus-roll-label">Now live at:</p>
            <div className="hero-campus-list">
              {campuses.map((c, i) => (
                <span
                  key={c.id}
                  className="hero-campus-chip"
                  style={{ animationDelay: `${2.9 + i * 0.06}s` }}
                >
                  <span className="hero-campus-dot" />
                  <span>{c.name}</span>
                </span>
              ))}
            </div>
          </div>
          <p className="hero-brand-copy">
            Built by students, for students. Your campus economy, in one place.
          </p>
        </div>
      )}

      {/* Mobile scroll indicator */}
      <div className="hero-scroll-indicator">
        <div className="hero-scroll-line" />
      </div>
    </section>
  );
}
