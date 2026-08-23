"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle, Users, Package, MessageSquare, AlertTriangle, Activity, Settings } from "lucide-react";
import type { Capability } from "@voeq/data";

/**
 * K3c.5 — Admin dashboard component.
 * Dense, operational, role-gated. NOT a marketing page.
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
    messagesLast24h: number;
    openReports: number;
    pendingVerifications: number;
    suspendedAccounts: number;
    systemErrors: number;
  };
}

export function AdminDashboard({ staff, capabilities, metrics }: AdminDashboardProps) {
  const canReviewCases = capabilities.includes("case.review");
  const canVerifyVendors = capabilities.includes("vendor.verify");
  const canViewAnalytics = capabilities.includes("analytics.read");
  const canEditConfig = capabilities.includes("config.write");
  const canViewAudit = capabilities.includes("audit.read");

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5", padding: "var(--space-4)" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <header style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "var(--space-4)",
          paddingBottom: "var(--space-3)",
          borderBottom: "2px solid #E0E0E0",
        }}>
          <div>
            <h1 style={{ 
              fontFamily: "var(--font-display)", 
              fontSize: 32, 
              margin: 0, 
              color: "#212121",
              fontWeight: 700,
            }}>
              Admin Dashboard
            </h1>
            <p style={{ margin: 0, marginTop: 4, fontSize: 14, color: "#666" }}>
              {staff.email} • {staff.staffRole.replace("_", " ")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ 
              background: "#1976D2", 
              color: "#fff", 
              padding: "6px 14px", 
              borderRadius: 6, 
              fontSize: 13, 
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              {staff.staffRole.replace("_", " ")}
            </span>
            <Link href="/settings" style={{ 
              color: "#666", 
              textDecoration: "none", 
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <Settings size={16} />
              Settings
            </Link>
          </div>
        </header>

        {/* Attention Queues */}
        <section style={{ marginBottom: "var(--space-4)" }}>
          <h2 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            margin: "0 0 12px 0", 
            color: "#212121",
            fontFamily: "var(--font-display)",
          }}>
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
                color="#EF5350"
              />
            )}
            {canVerifyVendors && metrics.pendingVerifications > 0 && (
              <AttentionCard
                icon={<CheckCircle size={24} />}
                title="Pending Verifications"
                count={metrics.pendingVerifications}
                description="Verification requests"
                href="/staff/moderation?tab=verifications"
                color="#FF9800"
              />
            )}
            {metrics.suspendedAccounts > 0 && (
              <AttentionCard
                icon={<AlertTriangle size={24} />}
                title="Suspended Accounts"
                count={metrics.suspendedAccounts}
                description="Needing review"
                href="/staff/moderation?tab=users"
                color="#F44336"
              />
            )}
            {metrics.systemErrors > 0 && (
              <AttentionCard
                icon={<Activity size={24} />}
                title="System Errors"
                count={metrics.systemErrors}
                description="Last 24 hours"
                href="/staff/analytics"
                color="#D32F2F"
              />
            )}
            {metrics.openReports === 0 && 
             metrics.pendingVerifications === 0 && 
             metrics.suspendedAccounts === 0 && 
             metrics.systemErrors === 0 && (
              <div style={{
                padding: "var(--space-3)",
                background: "#E8F5E9",
                borderRadius: 8,
                border: "1px solid #C8E6C9",
                gridColumn: "1 / -1",
              }}>
                <p style={{ margin: 0, color: "#2E7D32", fontSize: 14, fontWeight: 500 }}>
                  ✓ All clear - no urgent items
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Platform Health */}
        <section style={{ marginBottom: "var(--space-4)" }}>
          <h2 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            margin: "0 0 12px 0", 
            color: "#212121",
            fontFamily: "var(--font-display)",
          }}>
            Platform Health
          </h2>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", 
            gap: 12,
          }}>
            <MetricCard label="Users" value={metrics.totalUsers} icon={<Users size={20} />} />
            <MetricCard label="Vendors" value={metrics.totalVendors} icon={<Package size={20} />} />
            <MetricCard label="Listings" value={metrics.totalListings} icon={<Package size={20} />} />
            <MetricCard label="Messages (24h)" value={metrics.messagesLast24h} icon={<MessageSquare size={20} />} />
            {canReviewCases && <MetricCard label="Open Reports" value={metrics.openReports} icon={<AlertCircle size={20} />} color={metrics.openReports > 0 ? "#EF5350" : undefined} />}
            {canVerifyVendors && <MetricCard label="Pending Verify" value={metrics.pendingVerifications} icon={<CheckCircle size={20} />} color={metrics.pendingVerifications > 0 ? "#FF9800" : undefined} />}
            <MetricCard label="Suspended" value={metrics.suspendedAccounts} icon={<AlertTriangle size={20} />} color={metrics.suspendedAccounts > 0 ? "#F44336" : undefined} />
            <MetricCard label="Errors (24h)" value={metrics.systemErrors} icon={<Activity size={20} />} color={metrics.systemErrors > 0 ? "#D32F2F" : undefined} />
          </div>
        </section>

        {/* Recent Activity */}
        {canViewAudit && (
          <section style={{ marginBottom: "var(--space-4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ 
                fontSize: 18, 
                fontWeight: 600, 
                margin: 0, 
                color: "#212121",
                fontFamily: "var(--font-display)",
              }}>
                Recent Moderation Activity
              </h2>
              <Link href="/staff/audit" style={{ fontSize: 14, color: "#1976D2", textDecoration: "none" }}>
                View all →
              </Link>
            </div>
            <div style={{
              background: "#fff",
              border: "1px solid #E0E0E0",
              borderRadius: 8,
              padding: "var(--space-3)",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <ActivityItem 
                  actor="admin@voeq.ng" 
                  action="Approved vendor verification" 
                  target="Vendor #1234" 
                  time="2 hours ago"
                />
                <ActivityItem 
                  actor="moderator@voeq.ng" 
                  action="Resolved report" 
                  target="Report #5678" 
                  time="3 hours ago"
                />
                <ActivityItem 
                  actor="admin@voeq.ng" 
                  action="Updated category" 
                  target="Food & Drinks" 
                  time="5 hours ago"
                />
              </div>
            </div>
          </section>
        )}

        {/* Quick Links */}
        <section>
          <h2 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            margin: "0 0 12px 0", 
            color: "#212121",
            fontFamily: "var(--font-display)",
          }}>
            Quick Links
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {canReviewCases && <QuickLinkCard title="Moderation Queue" href="/staff/moderation" icon={<AlertCircle size={20} />} />}
            {canVerifyVendors && <QuickLinkCard title="Verifications" href="/staff/moderation?tab=verifications" icon={<CheckCircle size={20} />} />}
            {canViewAnalytics && <QuickLinkCard title="Analytics" href="/staff/analytics" icon={<Activity size={20} />} />}
            {canViewAudit && <QuickLinkCard title="Audit Log" href="/staff/audit" icon={<MessageSquare size={20} />} />}
            {canEditConfig && <QuickLinkCard title="Configuration" href="/staff/config" icon={<Settings size={20} />} />}
          </div>
        </section>
      </div>
    </div>
  );
}

// Reusable components
function AttentionCard({ 
  icon, 
  title, 
  count, 
  description, 
  href, 
  color 
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
      <div style={{
        background: "#fff",
        border: `2px solid ${color}`,
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
          <div style={{ color, display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, background: `${color}20`, borderRadius: 8 }}>
            {icon}
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "var(--font-display)" }}>
            {count}
          </span>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "#212121", marginBottom: 4 }}>
          {title}
        </h3>
        <p style={{ fontSize: 13, color: "#666", margin: 0 }}>
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
  color = "#1976D2" 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  color?: string;
}) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E0E0E0",
      borderRadius: 8,
      padding: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ color: "#999" }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: "var(--font-display)", marginBottom: 4 }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
    </div>
  );
}

function ActivityItem({ 
  actor, 
  action, 
  target, 
  time 
}: { 
  actor: string; 
  action: string; 
  target: string; 
  time: string;
}) {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center",
      paddingBottom: 12,
      borderBottom: "1px solid #F5F5F5",
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 14, color: "#212121" }}>
          <span style={{ fontWeight: 600 }}>{actor}</span> {action}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#999", marginTop: 2 }}>
          {target}
        </p>
      </div>
      <span style={{ fontSize: 12, color: "#999", whiteSpace: "nowrap" }}>
        {time}
      </span>
    </div>
  );
}

function QuickLinkCard({ 
  title, 
  href, 
  icon 
}: { 
  title: string; 
  href: string; 
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        background: "#fff",
        border: "1px solid #E0E0E0",
        borderRadius: 8,
        padding: "var(--space-3)",
        cursor: "pointer",
        transition: "border-color 120ms ease, transform 120ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#1976D2";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#E0E0E0";
        e.currentTarget.style.transform = "translateY(0)";
      }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ color: "#1976D2" }}>
            {icon}
          </div>
          <span style={{ fontSize: 15, fontWeight: 500, color: "#212121" }}>
            {title}
          </span>
        </div>
      </div>
    </Link>
  );
}
