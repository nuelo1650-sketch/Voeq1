"use client";

import Link from "next/link";
import { useReveal } from "./useReveal";
import { CATEGORIES } from "@/components/explore/Filters";

export function LandingCategories() {
  const { ref } = useReveal<HTMLDivElement>();
  return (
    <section data-testid="landing-categories" ref={ref} className="landing-section landing-categories">
      <h2 className="landing-section-title">Popular categories</h2>
      <div className="category-chips">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/c/${c.slug}`}
            data-testid={`category-chip-${c.slug}`}
            className="category-chip"
          >
            {c.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
