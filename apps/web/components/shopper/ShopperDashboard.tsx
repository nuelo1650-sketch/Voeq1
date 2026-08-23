"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Users, MessageCircle, Search, Heart, Clock } from "lucide-react";

interface HomeData {
  savedListings: (string | null)[];
  savedVendors: (string | null)[];
  following: string[];
  reviewCount: number;
  notifications: Array<{ id: string; title: string; body: string; read: boolean; createdAt: string }>;
  unreadNotifications: number;
  recommended: Array<{ id: string; title: string; vendorName: string; vendorId: string; priceMinor: number; image?: string; categorySlug?: string }>;
}

/**
 * ShopperDashboard — K3a.1 enhanced. Time-aware greeting, quick actions,
 * browsing sections, followed vendors, activity timeline.
 */
export function ShopperDashboard({ name, campus }: { name: string; campus?: string }) {
  const [data, setData] = useState<HomeData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    // Time-aware greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Date string
    const now = new Date();
    const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
    const month = now.toLocaleDateString("en-US", { month: "long" });
    const day = now.getDate();
    setDateStr(`${weekday}, ${month} ${day}`);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/home")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setErr("Could not load your dashboard."));
    return () => { cancelled = true; };
  }, []);

  if (err) {
    return (
      <div style={{ padding: "var(--space-4)", textAlign: "center" }}>
        <p style={{ color: "var(--color-amber-dark)", marginBottom: "var(--space-2)" }}>
          {err}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "8px 16px",
            background: "var(--color-forest)",
            color: "var(--color-cream)",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <LoadingSkeleton />
      </div>
    );
  }

  const savedCount = data.savedListings.length + data.savedVendors.length;
  const followingCount = data.following.length;
  const unreadMessages = 0; // Will come from API later

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* Greeting header */}
      <header
        data-testid="home-greeting"
        style={{
          borderBottom: "1px solid rgba(74, 74, 74, 0.2)",
          paddingBottom: "var(--space-3)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 32,
            margin: 0,
            marginBottom: 4,
            color: "var(--color-forest)",
          }}
        >
          {greeting}, {name}
        </h1>
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
          <p style={{ color: "var(--color-ink-muted)", fontSize: 14, margin: 0 }}>
            Browsing {campus || "your campus"}
          </p>
          <span style={{ color: "var(--color-ink-subtle)" }}>•</span>
          <p style={{ color: "var(--color-ink-muted)", fontSize: 14, margin: 0 }}>
            {dateStr}
          </p>
        </div>
      </header>

      {/* Quick actions row */}
      <section aria-label="Quick actions" data-testid="home-quick-actions">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "var(--space-2)",
          }}
        >
          <QuickActionCard
            icon={<Bookmark size={20} />}
            count={savedCount}
            label="Saved"
            href="/explore"
            testid="quick-action-saved"
          />
          <QuickActionCard
            icon={<Users size={20} />}
            count={followingCount}
            label="Following"
            href="/explore"
            testid="quick-action-following"
          />
          <QuickActionCard
            icon={<MessageCircle size={20} />}
            count={unreadMessages}
            label="Messages"
            href="/messages"
            testid="quick-action-messages"
          />
          <QuickActionCard
            icon={<Search size={20} />}
            count={null}
            label="Browse"
            href="/explore"
            testid="quick-action-browse"
          />
        </div>
      </section>

      {/* Continue browsing */}
      <Section title="Continue browsing" testid="home-continue-browsing" seeAllHref="/explore">
        <EmptyState
          icon={<Search size={24} />}
          text="Start exploring"
          ctaText="Find vendors"
          ctaHref="/explore"
        />
      </Section>

      {/* New on your campus */}
      <Section title="New on your campus" testid="home-new-vendors" seeAllHref="/explore">
        {data.recommended.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            text="No new vendors yet"
            ctaText="Explore campus"
            ctaHref="/explore"
          />
        ) : (
          <HorizontalRail>
            {data.recommended.slice(0, 6).map((vendor) => (
              <VendorCard
                key={vendor.id}
                id={vendor.vendorId || vendor.id}
                name={vendor.vendorName}
                category={vendor.categorySlug}
                image={vendor.image}
              />
            ))}
          </HorizontalRail>
        )}
      </Section>

      {/* Vendors you follow */}
      <Section title="Vendors you follow" testid="home-following-vendors" seeAllHref="/explore">
        {data.following.length === 0 ? (
          <EmptyState
            icon={<Heart size={24} />}
            text="Follow vendors to see their latest here"
            ctaText="Discover vendors"
            ctaHref="/explore"
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {data.following.slice(0, 3).map((vendorId) => (
              <Link
                key={vendorId}
                href={`/vendor/${vendorId}`}
                style={{
                  display: "block",
                  padding: "var(--space-2)",
                  border: "1px solid var(--color-ink-subtle)",
                  borderRadius: 8,
                  textDecoration: "none",
                  color: "var(--color-forest)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <strong>{vendorId}</strong>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Activity */}
      <Section title="Activity" testid="home-activity">
        {data.reviewCount === 0 && data.unreadNotifications === 0 ? (
          <EmptyState
            icon={<Clock size={24} />}
            text="Your activity will show up here"
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {data.reviewCount > 0 && (
              <ActivityItem
                label="Reviews written"
                count={data.reviewCount}
                href="/explore"
              />
            )}
            {data.unreadNotifications > 0 && (
              <ActivityItem
                label="Unread notifications"
                count={data.unreadNotifications}
                href="/notifications"
              />
            )}
            {data.savedListings.length > 0 && (
              <ActivityItem
                label="Saved listings"
                count={data.savedListings.length}
                href="/explore"
              />
            )}
          </div>
        )}
      </Section>
    </div>
  );
}

// Helper components

function LoadingSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 120,
            background: "var(--color-cream)",
            borderRadius: 8,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}

function Section({
  title,
  testid,
  seeAllHref,
  children,
}: {
  title: string;
  testid: string;
  seeAllHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-testid={testid}
      style={{
        padding: "var(--space-3) 0",
        borderBottom: "1px solid rgba(74, 74, 74, 0.2)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "var(--space-3)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            margin: 0,
            color: "var(--color-forest)",
          }}
        >
          {title}
        </h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            style={{
              color: "var(--color-forest-mid)",
              fontSize: 14,
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            See all →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function QuickActionCard({
  icon,
  count,
  label,
  href,
  testid,
}: {
  icon: React.ReactNode;
  count: number | null;
  label: string;
  href: string;
  testid: string;
}) {
  return (
    <Link
      href={href}
      data-testid={testid}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "var(--space-3)",
        background: "var(--color-cream)",
        border: "1px solid var(--color-ink-subtle)",
        borderRadius: 8,
        textDecoration: "none",
        color: "var(--color-forest)",
        transition: "all 0.2s",
        minHeight: 100,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ color: "var(--color-forest-mid)" }}>{icon}</div>
      {count !== null && (
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            fontFamily: "var(--font-display)",
            color: "var(--color-forest)",
          }}
        >
          {count}
        </div>
      )}
      <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
    </Link>
  );
}

function EmptyState({
  icon,
  text,
  ctaText,
  ctaHref,
}: {
  icon: React.ReactNode;
  text: string;
  ctaText?: string;
  ctaHref?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "var(--space-4)",
        color: "var(--color-ink-muted)",
      }}
    >
      <div style={{ opacity: 0.5 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 14 }}>{text}</p>
      {ctaText && ctaHref && (
        <Link
          href={ctaHref}
          style={{
            marginTop: 8,
            padding: "8px 16px",
            background: "var(--color-forest)",
            color: "var(--color-cream)",
            textDecoration: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {ctaText}
        </Link>
      )}
    </div>
  );
}

function HorizontalRail({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "var(--space-2)",
        overflowX: "auto",
        paddingBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function VendorCard({
  id,
  name,
  category,
  image,
}: {
  id: string;
  name: string;
  category?: string;
  image?: string;
}) {
  return (
    <Link
      href={`/vendor/${id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: 160,
        maxWidth: 160,
        textDecoration: "none",
        color: "var(--color-forest)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 120,
          background: image ? `url(${image}) center/cover` : "var(--color-cream)",
          borderRadius: 8,
          marginBottom: 8,
          border: "1px solid var(--color-ink-subtle)",
        }}
      />
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{name}</div>
      {category && (
        <div
          style={{
            fontSize: 12,
            color: "var(--color-ink-muted)",
            textTransform: "capitalize",
          }}
        >
          {category.replace(/-/g, " ")}
        </div>
      )}
    </Link>
  );
}

function ActivityItem({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "var(--space-2)",
        borderRadius: 6,
        textDecoration: "none",
        color: "var(--color-forest)",
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--color-cream)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ fontSize: 14 }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 600, fontFamily: "var(--font-display)" }}>
        {count}
      </span>
    </Link>
  );
}
