"use client";

import Link from "next/link";
import { Search, TrendingUp } from "lucide-react";

/**
 * EmptyState — enhanced empty state with category suggestions.
 * Shows when no results found, suggests trying other categories.
 */

const CATEGORY_SUGGESTIONS = [
  { emoji: "🍔", name: "Food & Drinks", slug: "food-drinks" },
  { emoji: "👗", name: "Fashion", slug: "fashion" },
  { emoji: "💻", name: "Tech Repair", slug: "tech-repairs" },
  { emoji: "💇", name: "Beauty & Care", slug: "beauty-care" },
  { emoji: "📚", name: "Academic Services", slug: "academic-services" },
];

interface EmptyStateProps {
  currentCategory?: string;
  searchQuery?: string;
}

export function EmptyState({ currentCategory, searchQuery }: EmptyStateProps) {
  // Filter out current category from suggestions
  const suggestions = CATEGORY_SUGGESTIONS.filter(c => c.slug !== currentCategory);

  return (
    <div
      data-testid="explore-empty-state"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-8) var(--space-4)",
        textAlign: "center",
        minHeight: 400,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "var(--color-cream)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "var(--space-4)",
        }}
      >
        <Search size={36} style={{ color: "var(--color-ink-muted)" }} />
      </div>

      {/* Message */}
      <h2
        style={{
          fontFamily: "var(--role-font-display)",
          fontSize: 24,
          fontWeight: 600,
          color: "var(--color-ink-deep)",
          margin: 0,
          marginBottom: "var(--space-2)",
        }}
      >
        {searchQuery ? `No results for "${searchQuery}"` : "No listings found"}
      </h2>

      <p
        style={{
          fontFamily: "var(--role-font-ui)",
          fontSize: 16,
          color: "var(--color-ink-muted)",
          margin: 0,
          marginBottom: "var(--space-5)",
          maxWidth: 400,
        }}
      >
        {currentCategory
          ? `No vendors found in this category. Try exploring other categories below.`
          : searchQuery
          ? "Try adjusting your search or browse by category."
          : "Be the first to list your business or explore other categories."}
      </p>

      {/* Category suggestions */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: "var(--space-5)", width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: "var(--space-3)",
            }}
          >
            <TrendingUp size={18} style={{ color: "var(--color-forest)" }} />
            <p
              style={{
                fontFamily: "var(--role-font-ui)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-forest)",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Try these categories
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            {suggestions.map((cat) => (
              <Link
                key={cat.slug}
                href={`/explore?category=${cat.slug}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  background: "var(--color-cream)",
                  border: "1px solid var(--color-ink-subtle)",
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--color-ink-deep)",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-forest)";
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.borderColor = "var(--color-forest)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-cream)";
                  e.currentTarget.style.color = "var(--color-ink-deep)";
                  e.currentTarget.style.borderColor = "var(--color-ink-subtle)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/explore"
          style={{
            padding: "12px 24px",
            background: "var(--color-forest)",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.2s ease",
            display: "inline-block",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-forest-dark)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-forest)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Browse all categories
        </Link>

        <Link
          href="/for-vendors"
          style={{
            padding: "12px 24px",
            background: "transparent",
            color: "var(--color-forest)",
            border: "1px solid var(--color-forest)",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.2s ease",
            display: "inline-block",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-cream)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          Become a vendor
        </Link>
      </div>
    </div>
  );
}
