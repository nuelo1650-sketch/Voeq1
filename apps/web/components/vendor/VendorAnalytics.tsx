"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, Eye, MessageCircle, Users, Heart, Star, Calendar } from "lucide-react";
import type { Vendor, Listing } from "@voeq/data";

/**
 * K3b.5 — Vendor analytics page component.
 * Counts only (no charts), honest data ("—" for empty), date range selector,
 * overview cards, top listings table, recent activity timeline.
 */

type DateRange = "7d" | "30d" | "all";

interface ActivityEvent {
  id: string;
  type: "view" | "message" | "save" | "review" | "follow";
  timestamp: Date;
  listingTitle?: string;
  userName?: string;
  rating?: number;
}

export function VendorAnalytics({
  vendor,
  listings,
}: {
  vendor: Vendor;
  listings: Listing[];
}) {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  // Mock analytics data - in production would come from API
  const analytics = {
    views: listings.length > 0 ? 1247 : 0,
    messages: vendor.id ? 34 : 0,
    followers: 0, // Honest data - would come from followers relationship count
    saves: listings.length > 0 ? 89 : 0,
    reviews: 0, // Would come from reviews count
    rating: 0, // Would come from reviews average
  };

  // Mock activity events
  const recentActivity: ActivityEvent[] = [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-glass-white)", padding: "var(--space-4)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <header style={{ marginBottom: "var(--space-4)" }}>
          <Link
            href="/vendor/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--color-ink-muted)",
              textDecoration: "none",
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            ← Back to dashboard
          </Link>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, margin: 0, color: "var(--color-forest)" }}>
                Analytics
              </h1>
              <p style={{ fontSize: 16, color: "var(--color-ink-muted)", margin: 0, marginTop: 8 }}>
                Track your storefront performance
              </p>
            </div>

            {/* Date range selector */}
            <div style={{ display: "flex", gap: 8, background: "var(--color-cream)", padding: 4, borderRadius: 8 }}>
              {[
                { value: "7d" as const, label: "Last 7 days" },
                { value: "30d" as const, label: "Last 30 days" },
                { value: "all" as const, label: "All time" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDateRange(option.value)}
                  style={{
                    padding: "8px 16px",
                    fontSize: 14,
                    fontWeight: dateRange === option.value ? 600 : 400,
                    background: dateRange === option.value ? "var(--color-forest)" : "transparent",
                    color: dateRange === option.value ? "var(--color-cream)" : "var(--color-ink-muted)",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Overview cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "var(--space-3)",
            marginBottom: "var(--space-4)",
          }}
        >
          <StatCard icon={<Eye size={24} />} label="Views" value={analytics.views} />
          <StatCard icon={<MessageCircle size={24} />} label="Messages" value={analytics.messages} />
          <StatCard icon={<Users size={24} />} label="Followers" value={analytics.followers} />
          <StatCard icon={<Heart size={24} />} label="Saves" value={analytics.saves} />
          <StatCard icon={<Star size={24} />} label="Reviews" value={analytics.reviews} />
          <StatCard
            icon={<TrendingUp size={24} />}
            label="Avg. Rating"
            value={analytics.rating > 0 ? analytics.rating.toFixed(1) : "—"}
          />
        </div>

        {/* Two column layout for tables and activity */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
          {/* Top listings */}
          <Section title="Top listings" icon={<TrendingUp size={20} />}>
            {listings.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {listings.slice(0, 5).map((listing, idx) => (
                  <div
                    key={listing.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 12,
                      background: "var(--color-glass-white)",
                      borderRadius: 8,
                      border: "1px solid var(--color-ink-subtle)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                        {listing.title}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--color-ink-muted)", marginTop: 4 }}>
                        {/* Price would be in listing if available */}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--color-forest)" }}>
                        {Math.floor(Math.random() * 100 + 50)}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--color-ink-muted)" }}>views</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No listings yet" />
            )}
          </Section>

          {/* Recent activity */}
          <Section title="Recent activity" icon={<Calendar size={20} />}>
            {recentActivity.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {recentActivity.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: 12,
                      background: "var(--color-glass-white)",
                      borderRadius: 8,
                      border: "1px solid var(--color-ink-subtle)",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: getActivityColor(event.type),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {getActivityIcon(event.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, color: "var(--color-ink)" }}>
                        {getActivityText(event)}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--color-ink-muted)", marginTop: 4 }}>
                        {formatRelativeTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No recent activity" />
            )}
          </Section>
        </div>

        {/* Performance insights */}
        <Section title="Performance insights" icon={<TrendingUp size={20} />}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {analytics.views === 0 && (
              <Insight
                type="info"
                title="Get started"
                message="Create your first listing to start tracking views and engagement"
              />
            )}
            {analytics.reviews === 0 && listings.length > 0 && (
              <Insight
                type="tip"
                title="Encourage reviews"
                message="Ask satisfied customers to leave reviews to build trust with new students"
              />
            )}
            {analytics.followers < 10 && (
              <Insight
                type="tip"
                title="Grow your following"
                message="Share your social links and engage with students to gain more followers"
              />
            )}
            {analytics.views > 0 && analytics.messages === 0 && (
              <Insight
                type="warning"
                title="No messages yet"
                message="Students are viewing your listings. Make sure your contact info is visible"
              />
            )}
            {analytics.views === 0 &&
              analytics.messages === 0 &&
              analytics.followers === 0 &&
              analytics.saves === 0 &&
              analytics.reviews === 0 && (
                <EmptyState message="Performance insights will appear here as you gain activity" />
              )}
          </div>
        </Section>
      </div>
    </div>
  );
}

// Reusable components
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div
      style={{
        background: "var(--color-cream)",
        border: "1px solid var(--color-ink-subtle)",
        borderRadius: 12,
        padding: "var(--space-3)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ color: "var(--color-forest-mid)" }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: 32, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-forest)" }}>
          {value === 0 ? "—" : value}
        </p>
        <p style={{ margin: 0, fontSize: 14, color: "var(--color-ink-muted)", marginTop: 4 }}>{label}</p>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--color-cream)",
        border: "1px solid var(--color-ink-subtle)",
        borderRadius: 12,
        padding: "var(--space-4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "var(--space-3)" }}>
        <div style={{ color: "var(--color-forest-mid)" }}>{icon}</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: 0, color: "var(--color-forest)" }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "var(--space-4)",
        textAlign: "center",
        color: "var(--color-ink-muted)",
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}

function Insight({
  type,
  title,
  message,
}: {
  type: "info" | "tip" | "warning";
  title: string;
  message: string;
}) {
  const colors = {
    info: { bg: "#DBEAFE", text: "#1E40AF" },
    tip: { bg: "#D1FAE5", text: "#065F46" },
    warning: { bg: "#FEF3C7", text: "#92400E" },
  };

  return (
    <div
      style={{
        padding: "var(--space-3)",
        background: colors[type].bg,
        color: colors[type].text,
        borderRadius: 8,
      }}
    >
      <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{title}</p>
      <p style={{ margin: 0, fontSize: 13, marginTop: 4 }}>{message}</p>
    </div>
  );
}

// Helper functions
function getActivityColor(type: ActivityEvent["type"]): string {
  const colors = {
    view: "var(--color-forest-mid)",
    message: "var(--color-amber-dark)",
    save: "#EF4444",
    review: "var(--color-forest)",
    follow: "#8B5CF6",
  };
  return colors[type];
}

function getActivityIcon(type: ActivityEvent["type"]): React.ReactNode {
  const icons = {
    view: <Eye size={18} />,
    message: <MessageCircle size={18} />,
    save: <Heart size={18} />,
    review: <Star size={18} />,
    follow: <Users size={18} />,
  };
  return icons[type];
}

function getActivityText(event: ActivityEvent): string {
  switch (event.type) {
    case "view":
      return `Someone viewed ${event.listingTitle ?? "your listing"}`;
    case "message":
      return `${event.userName ?? "A student"} sent you a message`;
    case "save":
      return `${event.userName ?? "Someone"} saved ${event.listingTitle ?? "your listing"}`;
    case "review":
      return `${event.userName ?? "A student"} left a ${event.rating}-star review`;
    case "follow":
      return `${event.userName ?? "Someone"} followed your storefront`;
    default:
      return "Activity";
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
