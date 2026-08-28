"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Search, UtensilsCrossed, Shirt, Laptop, Sparkles, BookOpen } from "lucide-react";
import { mockCampusRepo, type Campus } from "@voeq/data";
import { categories } from "@voeq/data";

const CAT_ICONS: Record<string, React.ReactNode> = {
  "food-drinks": <UtensilsCrossed size={16} />,
  fashion: <Shirt size={16} />,
  "tech-repairs": <Laptop size={16} />,
  "beauty-care": <Sparkles size={16} />,
  "academic-services": <BookOpen size={16} />,
};

interface HeroSectionProps {
  onSearch?: (query: string, category?: string) => void;
}

export function HeroSection({ onSearch }: HeroSectionProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setMounted(true);
    mockCampusRepo.list().then((rows) => {
      setCampuses(rows.filter((c) => c.status === "verified"));
    });
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append("q", searchQuery);
    if (selectedCategory !== "all") params.append("category", selectedCategory);
    const queryString = params.toString();
    if (onSearch) {
      onSearch(searchQuery, selectedCategory === "all" ? undefined : selectedCategory);
    }
    router.push(queryString ? `/explore?${queryString}` : "/explore");
  };

  // Kinetic headline: each word reveals sequentially
  const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number];
  const easeInOut = [0.4, 0, 0.2, 1] as [number, number, number, number];

  const wordVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        delay: shouldReduceMotion ? 0 : i * 0.4,
        duration: shouldReduceMotion ? 0 : 0.5,
        ease: easeOut,
      },
    }),
  };

  const growVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: shouldReduceMotion ? 0 : 1.2,
        duration: shouldReduceMotion ? 0 : 0.6,
        ease: easeOut,
      },
    },
  };

  const underlineVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: {
        delay: shouldReduceMotion ? 0 : 1.6,
        duration: shouldReduceMotion ? 0 : 0.4,
        ease: easeOut,
      },
    },
  };

  const tracerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: [0, 1, 1, 0],
      x: [0, 40, 80, 120],
      y: [0, -10, 5, 0],
      transition: {
        delay: shouldReduceMotion ? 0 : 0.5,
        duration: shouldReduceMotion ? 0 : 2,
        ease: easeInOut,
      },
    },
  };

  const ctaVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: shouldReduceMotion ? 0 : 1.8,
        duration: shouldReduceMotion ? 0 : 0.4,
        ease: easeOut,
      },
    },
  };

  const words = ["Find.", "Connect."];

  return (
    <section className="hero-section">
      <div className="hero-content">
        {/* Kinetic headline */}
        <div ref={headlineRef} style={{ position: "relative" }}>
          <h1 className="hero-headline" aria-label="Find. Connect. Grow.">
            {words.map((word, i) => (
              <motion.span
                key={word}
                custom={i}
                initial="hidden"
                animate={mounted ? "visible" : "hidden"}
                variants={wordVariants}
                style={{ display: "inline-block", marginRight: "0.3em" }}
              >
                {word}
              </motion.span>
            ))}
            <motion.span
              custom={words.length}
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              variants={growVariants}
              style={{
                display: "inline-block",
                fontStyle: "italic",
                color: "var(--color-gold, #D4A054)",
                transformOrigin: "left center",
              }}
            >
              Grow.
            </motion.span>
          </h1>
          {/* Underline draw-in */}
          <motion.div
            initial="hidden"
            animate={mounted ? "visible" : "hidden"}
            variants={underlineVariants}
            style={{
              height: 3,
              background: "var(--color-gold, #D4A054)",
              borderRadius: 2,
              marginTop: 8,
              transformOrigin: "left center",
              maxWidth: 200,
            }}
            aria-hidden="true"
          />
          {/* Tracer dot */}
          {!shouldReduceMotion && (
            <motion.div
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              variants={tracerVariants}
              style={{
                position: "absolute",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--color-gold, #D4A054)",
                top: 0,
                left: 0,
                pointerEvents: "none",
              }}
              aria-hidden="true"
            />
          )}
        </div>

        <motion.p
          initial="hidden"
          animate={mounted ? "visible" : "hidden"}
          variants={ctaVariants}
          className="hero-subheadline"
        >
          The campus marketplace for Nigerian students
        </motion.p>

        {/* Search bar */}
        <motion.form
          onSubmit={handleSearch}
          initial="hidden"
          animate={mounted ? "visible" : "hidden"}
          variants={ctaVariants}
          className="hero-search-bar"
        >
          <div className="hero-search-input-wrapper">
            <Search size={20} className="hero-search-icon" />
            <input
              type="text"
              placeholder="What are you looking for?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="hero-search-input"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="hero-search-select"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit" className="hero-search-btn">
            Search
          </button>
        </motion.form>

        {/* Category pills */}
        <motion.div
          initial="hidden"
          animate={mounted ? "visible" : "hidden"}
          variants={ctaVariants}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
          }}
        >
          {[
            { iconKey: "food-drinks", name: "Food", slug: "food-drinks" },
            { iconKey: "fashion", name: "Fashion", slug: "fashion" },
            { iconKey: "tech-repairs", name: "Tech Repair", slug: "tech-repairs" },
            { iconKey: "beauty-care", name: "Beauty", slug: "beauty-care" },
            { iconKey: "academic-services", name: "Academic", slug: "academic-services" },
          ].map((cat) => (
            <Link
              key={cat.slug}
              href={`/explore?category=${cat.slug}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                background: "var(--glass-bg)",
                backdropFilter: "var(--glass-blur)",
                WebkitBackdropFilter: "var(--glass-blur)",
                border: "1px solid var(--glass-border)",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 500,
                color: "var(--color-ink-deep)",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ color: "var(--color-forest)", display: "inline-flex", alignItems: "center" }}>
                {CAT_ICONS[cat.iconKey]}
              </span>
              <span>{cat.name}</span>
            </Link>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial="hidden"
          animate={mounted ? "visible" : "hidden"}
          variants={ctaVariants}
          className="hero-ctas"
        >
          <Link href="/explore" className="btn-primary btn-lg">
            Explore
          </Link>
          <Link href="/for-vendors" className="btn-ghost btn-lg">
            Become a vendor
          </Link>
        </motion.div>
      </div>

      {/* Campus roll-call (desktop right column) */}
      {campuses.length > 0 && (
        <motion.div
          initial="hidden"
          animate={mounted ? "visible" : "hidden"}
          variants={ctaVariants}
          className="hero-campus-roll"
          style={{
            display: "none",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--color-ink-muted)", marginBottom: 8 }}>
            Now live at:
          </p>
          <div className="hero-campus-list">
            {campuses.map((c) => (
              <span key={c.id} className="hero-campus-chip">
                {c.name}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}
