"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, Users, Package, MessageSquare, AlertTriangle, Activity, Settings } from "lucide-react";
import type { Capability } from "@voeq/data";

/**
 * K3c.5 — Admin dashboard component.
 * Dense, operational, role-gated. NOT a marketing page.
 * Token-driven (no raw hex). Recent-activity section shows real audit data
 * via /api/staff/audit (fetched client-side) — no fabricated entries.
 */

interface AdminDashboardProps {
  staff: {
    id: string;
    staffRole: string;
    email: string;
  };
  capabilities: Capability[];
  metrics: {
    totalUsers: number;
    totalVendors: number;
    totalListings: number;
    messageVolume24h: number;
    newSignups24h: number;
    openReports: number;
    pendingVerifications: number;
    suspendedAccounts: number;
  };
}

export function AdminDashboard({ staff, capabilities, metrics }: AdminDashboardProps) {
  const canReviewCases = capabilities.includes("case.review");
  // P-A round 60: team management link (promote UI).
  const canPromote = capabilities.includes("staff.promote");
  const canVerifyVendors = capabilities.includes("vendor.verify");
  const canViewAnalytics = capabilities.includes("analytics.read");
  const canEditConfig = capabilities.includes("config.write");
  const canViewAudit = capabilities.includes("audit.read");

  return (
    <div style={{ minHeight: "100vh", background: "var(--role-surface, #F5F3EF)", padding: "var(--space-4)" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "var(--space-3)",
            marginBottom: "var(--space-4)",
            paddingBottom: "var(--space-3)",
            borderBottom: "2px solid var(--role-border, #e6e1d6)",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 32,
                margin: 0,
                color: "var(--color-forest, #0F2A1D)",
                fontWeight: 700,
              }}
            >
              Admin Dashboard
            </h1>
            <p style={{ margin: 0, marginTop: 4, fontSize: 14, color: "var(--role-text-muted, #5b6b60)" }}>
              {staff.email} • {staff.staffRole.replace("_", " ")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span
              style={{
                background: "var(--role-accent-strong, #0F2A1D)",
                color: "var(--role-on-accent, #F5F3EF)",
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {staff.staffRole.replace("_", " ")}
            </span>
            <Link
              href="/settings"
              style={{
                color: "var(--role-text-muted, #5b6b60)",
                textDecoration: "none",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Settings size={16} />
              Settings
            </Link>
          </div>
        </header>

        {/* Attention Queues */}
        <section style={{ marginBottom: "var(--space-4)" }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              margin: "0 0 12px 0",
              color: "var(--color-forest, #0F2A1D)",
              fontFamily: "var(--font-display)",
            }}
          >
            Needs Attention
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {canReviewCases && metrics.openReports > 0 && (
              <AttentionCard
                icon={<AlertCircle size={24} />}
                title="Open Reports"
                count={metrics.openReports}
                description="Awaiting triage"
                href="/staff/moderation"
                color="var(--role-danger, #dc2626)"
              />
            )}
            {canVerifyVendors && metrics.pendingVerifications > 0 && (
              <AttentionCard
                icon={<CheckCircle size={24} />}
                title="Pending Verifications"
                count={metrics.pendingVerifications}
                description="Verification requests"
                href="/staff/moderation?tab=verifications"
                color="var(--role-warning, #d97706)"
              />
            )}
            {metrics.suspendedAccounts > 0 && (
              <AttentionCard
                icon={<AlertTriangle size={24} />}
                title="Suspended Accounts"
                count={metrics.suspendedAccounts}
                description="Needing review"
                href="/staff/moderation?tab=users"
                color="var(--role-danger, #dc2626)"
              />
            )}
            {metrics.openReports === 0 &&
              metrics.pendingVerifications === 0 &&
              metrics.suspendedAccounts === 0 && (
                <div
                  style={{
                    padding: "var(--space-3)",
                    background: "var(--role-success-bg, #E8F5E9)",
                    borderRadius: 8,
                    border: "1px solid var(--role-success-border, #C8E6C9)",
                    gridColumn: "1 / -1",
                  }}
                >
                  <p style={{ margin: 0, color: "var(--role-success-text, #2E7D32)", fontSize: 14, fontWeight: 500 }}>
                    ✓ All clear - no urgent items
                  </p>
                </div>
              )}
          </div>
        </section>

        {/* Platform Health */}
        <section style={{ marginBottom: "var(--space-4)" }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              margin: "0 0 12px 0",
              color: "var(--color-forest, #0F2A1D)",
              fontFamily: "var(--font-display)",
            }}
          >
            Platform Health
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <MetricCard label="Users" value={metrics.totalUsers} icon={<Users size={20} />} />
            <MetricCard label="Vendors" value={metrics.totalVendors} icon={<Package size={20} />} />
            <MetricCard label="Listings" value={metrics.totalListings} icon={<Package size={20} />} />
            <MetricCard label="Messages (24h)" value={metrics.messageVolume24h} icon={<MessageSquare size={20} />} />
            {canReviewCases && (
              <MetricCard
                label="Open Reports"
                value={metrics.openReports}
                icon={<AlertCircle size={20} />}
                color={metrics.openReports > 0 ? "var(--role-danger, #dc2626)" : undefined}
              />
            )}
            {canVerifyVendors && (
              <MetricCard
                label="Pending Verify"
                value={metrics.pendingVerifications}
                icon={<CheckCircle size={20} />}
                color={metrics.pendingVerifications > 0 ? "var(--role-warning, #d97706)" : undefined}
              />
            )}
            <MetricCard label="New Signups (24h)" value={metrics.newSignups24h} icon={<Activity size={20} />} />
          </div>
        </section>

        {/* Recent Activity — real audit data, honest empty state (no fabricated entries) */}
        {canViewAudit && <RecentActivity />}

        {/* Quick Links */}
        <section>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              margin: "0 0 12px 0",
              color: "var(--color-forest, #0F2A1D)",
              fontFamily: "var(--font-display)",
            }}
          >
            Quick Links
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {canReviewCases && <QuickLinkCard title="Moderation Queue" href="/staff/moderation" icon={<AlertCircle size={20} />} />}
            {canVerifyVendors && <QuickLinkCard title="Verifications" href="/staff/moderation?tab=verifications" icon={<CheckCircle size={20} />} />}
            {canViewAnalytics && <QuickLinkCard title="Analytics" href="/staff/analytics" icon={<Activity size={20} />} />}
            {canPromote && <QuickLinkCard title="Team & Roles" href="/staff/team" icon={<Users size={20} />} />}
            {canViewAudit && <QuickLinkCard title="Audit Log" href="/staff/audit" icon={<MessageSquare size={20} />} />}
            {canEditConfig && <QuickLinkCard title="Configuration" href="/staff/config" icon={<Settings size={20} />} />}
          </div>
        </section>
      </div>
    </div>
  );
}

// Real recent-activity: fetches /api/staff/audit, shows entries or an honest empty state.
function RecentActivity() {
  const [entries, setEntries] = useState<Array<{ id: string; type: string; at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/staff/audit")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.ok) return;
        setEntries((d.entries ?? []).slice(0, 5).map((e: { id: string; type: string; at: string }) => ({
          id: e.id,
          type: e.type,
          at: e.at,
        })));
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section style={{ marginBottom: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            margin: 0,
            color: "var(--color-forest, #0F2A1D)",
            fontFamily: "var(--font-display)",
          }}
        >
          Recent Moderation Activity
        </h2>
        <Link href="/staff/audit" style={{ fontSize: 14, color: "var(--role-accent-strong, #0F2A1D)", textDecoration: "none" }}>
          View all →
        </Link>
      </div>
      <div
        style={{
          background: "var(--role-surface, #fff)",
          border: "1px solid var(--role-border, #e6e1d6)",
          borderRadius: 8,
          padding: "var(--space-3)",
        }}
      >
        {loading ? (
          <p style={{ margin: 0, color: "var(--role-text-muted, #5b6b60)", fontSize: 14 }}>Loading…</p>
        ) : entries.length === 0 ? (
          <p style={{ margin: 0, color: "var(--role-text-muted, #5b6b60)", fontSize: 14 }}>
            No recent moderation activity.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {entries.map((e) => (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: 12,
                  borderBottom: "1px solid var(--role-border, #e6e1d6)",
                }}
              >
                <p style={{ margin: 0, fontSize: 14, color: "var(--color-forest, #0F2A1D)" }}>
                  <span style={{ fontWeight: 600 }}>{e.type}</span>
                </p>
                <span style={{ fontSize: 12, color: "var(--role-text-muted, #5b6b60)", whiteSpace: "nowrap" }}>
                  {new Date(e.at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Reusable components
function AttentionCard({
  icon,
  title,
  count,
  description,
  href,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "var(--role-surface, #fff)",
          border: "2px solid " + color,
          borderRadius: 8,
          padding: "var(--space-3)",
          cursor: "pointer",
          transition: "transform 120ms ease, box-shadow 120ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ color, display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, background: "color-mix(in srgb, " + color + " 12%, transparent)", borderRadius: 8 }}>
            {icon}
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "var(--font-display)" }}>
            {count}
          </span>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "var(--color-forest, #0F2A1D)", marginBottom: 4 }}>
          {title}
        </h3>
        <p style={{ fontSize: 13, color: "var(--role-text-muted, #5b6b60)", margin: 0 }}>
          {description}
        </p>
      </div>
    </Link>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color = "var(--role-accent-strong, #0F2A1D)",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div
      style={{
        background: "var(--role-surface, #fff)",
        border: "1px solid var(--role-border, #e6e1d6)",
        borderRadius: 8,
        padding: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ color: "var(--role-text-muted, #5b6b60)" }}>{icon}</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: "var(--font-display)", marginBottom: 4 }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: 12, color: "var(--role-text-muted, #5b6b60)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
    </div>
  );
}

function QuickLinkCard({
  title,
  href,
  icon,
}: {
  title: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "var(--role-surface, #fff)",
          border: "1px solid var(--role-border, #e6e1d6)",
          borderRadius: 8,
          padding: "var(--space-3)",
          cursor: "pointer",
          transition: "border-color 120ms ease, transform 120ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--role-accent-strong, #0F2A1D)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--role-border, #e6e1d6)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ color: "var(--role-accent-strong, #0F2A1D)" }}>{icon}</div>
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--color-forest, #0F2A1D)" }}>{title}</span>
        </div>
      </div>
    </Link>
  );
}
