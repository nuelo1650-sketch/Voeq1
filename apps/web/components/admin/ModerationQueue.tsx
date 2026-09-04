"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle, Flag, User, X, Check, Eye, EyeOff, Inbox } from "lucide-react";
import type { Capability } from "@voeq/data";
import { UsersPanel } from "./UsersPanel";
import { ListingsPanel } from "./ListingsPanel";
import { CommentsPanel } from "./CommentsPanel";
import { AppealsPanel } from "./AppealsPanel";
import { CaseDrawer } from "./CaseDrawer";

/**
 * K3c.6 — Moderation queue component.
 * Four tabs: Reports, Verifications, Content, Users.
 * Bulk actions, detail panels, audit logging.
 */

interface ModerationQueueProps {
  staff: {
    id: string;
    staffRole: string;
    email: string;
  };
  capabilities: Capability[];
}

type Tab = "reports" | "verifications" | "content" | "users" | "appeals";

// Real case shape (from /api/staff/cases). The backend stores generic cases;
// we surface queue + status + decision honestly (no invented reporter names).
interface Report {
  id: string;
  type: "vendor" | "listing" | "review" | "message";
  targetId: string;
  targetName: string;
  reporterName: string;
  category: string;
  date: Date;
  status: "open" | "triaged" | "resolved" | "dismissed";
  description: string;
}

interface VerificationRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  requestDate: Date;
  submittedInfo: string;
  status: "open" | "triaged" | "resolved" | "dismissed";
}

const TABS: Tab[] = ["reports", "verifications", "content", "users", "appeals"];

export function ModerationQueue({ staff, capabilities }: ModerationQueueProps) {
  // P-A round 81 (FIX — '?tab=verifications' deep links always opened
  // 'reports'): the tab was hardcoded initial state. Now the URL query wins
  // on mount AND on later param changes (clicking a second deep link while
  // already on the page).
  const searchParams = useSearchParams();
  const initialTab: Tab = (TABS as string[]).includes(searchParams.get("tab") ?? "")
    ? (searchParams.get("tab") as Tab)
    : "reports";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && (TABS as string[]).includes(t)) setActiveTab(t as Tab);
  }, [searchParams]);
  const [detailPanelId, setDetailPanelId] = useState<string | null>(null);
  // T10: bump after a drawer action so the underlying tab lists re-fetch.
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionModal, setActionModal] = useState<{
    action: string;
    itemId: string;
  } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  // P-A round 60 (C3): toast so failed actions are no longer silent.
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  // P-A round 60: content-moderation queue (reviews).
  const [contentItems, setContentItems] = useState<Array<{
    id: string; authorId: string; vendorId: string; rating: number; body: string;
    status: string; createdAt: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch("/api/staff/cases?queue=reports").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/staff/cases?queue=verifications").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([rep, ver]) => {
        if (cancelled) return;
        if (rep?.ok) {
          setReports(
            (rep.cases as Array<{ id: string; queue: string; status: string; resolution?: string | null; payload?: Record<string, unknown> | null; createdAt?: string | null; consequence?: string | null }>).map((c) => ({
              id: c.id,
              type: ((c.payload?.["targetType"] as Report["type"]) ?? "listing"),
              targetId: ((c.payload?.["targetId"] as string) ?? c.id),
              targetName: (c.payload?.["body"] as string)?.slice(0, 60) || "—",
              reporterName: (c.payload?.["reporterId"] as string)?.slice(0, 8) ?? "—",
              category: ((c.payload?.["category"] as string) ?? c.queue ?? "reports"),
              // P-A round 57 (C3): real creation time — was `new Date()` (fabricated "just now" for every row).
              date: c.createdAt ? new Date(c.createdAt) : new Date(0),
              status: c.status as Report["status"],
              description: c.consequence ?? "No description recorded.",
            })),
          );
        }
        if (ver?.ok) {
          setVerifications(
            (ver.cases as Array<{ id: string; queue: string; status: string; resolution?: string | null; payload?: Record<string, unknown> | null; createdAt?: string | null }>).map(
              (c) => ({
                id: c.id,
                vendorId: ((c.payload?.["vendorId"] as string) ?? c.id),
                vendorName: ((c.payload?.["vendorName"] as string) ?? `Vendor ${c.id.slice(0, 8)}`),
                requestDate: c.createdAt ? new Date(c.createdAt) : new Date(0),
                submittedInfo: ((c.payload?.["description"] as string) ?? c.resolution ?? "Pending review."),
                status: c.status as VerificationRequest["status"],
              }),
            ),
          );
        }
        // P-A round 60: content-moderation queue (reviews).
        fetch("/api/staff/content")
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (cancelled || !d?.ok) return;
            setContentItems((d.items as Array<{ id: string; authorId: string; vendorId: string; rating: number; body: string; status: string; createdAt: string }>) ?? []);
          })
          .catch(() => {});
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const handleAction = async (action: string, itemId: string) => {
    setActionModal({ action, itemId });
    setActionReason("");
  };

  const confirmAction = async () => {
    if (!actionModal) return;
    const caseId = actionModal.itemId;
    if (activeTab === "verifications") {
      // P-A round 57 (C7): a verification decision is NOT a generic case
      // triage — it must call the real verify API (VS7.8) to flip vendor.verified.
      const detail = verifications.find((v) => v.id === caseId);
      try {
        const res = await fetch("/api/staff/verify-vendor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendorId: detail?.vendorId ?? caseId,
            decision: actionModal.action === "approve" ? "approve" : "deny",
            reason: actionReason || undefined,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setToast({ kind: "error", text: `Verification failed: ${(d as { error?: string }).error ?? res.status}` });
        } else {
          setToast({ kind: "success", text: `${actionModal.action === "approve" ? "Approved" : "Denied"} ✓` });
        }
      } catch {
        setToast({ kind: "error", text: "Network error — action not applied." });
      }
      setActionModal(null);
      setActionReason("");
      return;
    }
    // Map UI action to triage action; resolution required by backend.
    const triageAction =
      actionModal.action === "approve" || actionModal.action === "resolve"
        ? "resolve"
        : actionModal.action === "deny" || actionModal.action === "dismiss"
          ? "dismiss"
          : "assign";
    try {
      const res = await fetch("/api/staff/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          action: triageAction,
          resolution: actionReason || `${actionModal.action} via moderation queue`,
        }),
      });
      // P-A round 57 (C3): the old code NEVER checked res.ok — the backend
      // 404'd every action (listCases("") matched nothing) and the UI silently
      // cleared the selection, so staff believed they'd resolved cases. Now:
      // surface the failure instead of swallowing it.
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setToast({ kind: "error", text: `Action failed: ${(d as { error?: string }).error ?? res.status}` });
        setActionModal(null);
        setActionReason("");
        return;
      }
      setToast({ kind: "success", text: "Action applied ✓" });
    } catch {
      setToast({ kind: "error", text: "Network error — action not applied." });
    }
    setActionModal(null);
    setActionReason("");
  };

  const toggleContentStatus = async (item: { id: string; status: string }) => {
    const action = item.status === "visible" ? "hide" : "show";
    try {
      const res = await fetch("/api/staff/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: item.id, action }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setToast({ kind: "error", text: `Action failed: ${(d as { error?: string }).error ?? res.status}` });
        return;
      }
      setToast({ kind: "success", text: action === "hide" ? "Review hidden ✓" : "Review restored ✓" });
      setContentItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: action === "hide" ? "hidden" : "visible" } : x)));
    } catch {
      setToast({ kind: "error", text: "Network error — action not applied." });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--role-surface-sunken)", padding: "var(--space-4)" }}>
      {/* P-A round 57 (C3): action feedback toast */}
      {toast && (
        <div
          data-testid="moderation-toast"
          role="status"
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            padding: "10px 18px",
            borderRadius: 999,
            fontFamily: "var(--role-font-ui)",
            fontSize: 14,
            fontWeight: 600,
            color: toast.kind === "success" ? "var(--color-cream)" : "var(--role-danger)",
            background: toast.kind === "success" ? "var(--color-forest)" : "color-mix(in srgb, var(--role-danger) 10%, var(--role-surface))",
            border: `1px solid ${toast.kind === "success" ? "transparent" : "color-mix(in srgb, var(--role-danger) 40%, transparent)"}`,
            boxShadow: "0 10px 28px rgba(15,42,29,.18)",
          }}
        >
          {toast.text}
        </div>
      )}
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <header style={{ marginBottom: "var(--space-4)" }}>
          <Link href="/staff" style={{ fontSize: 14, color: "var(--role-accent-strong)", textDecoration: "none", marginBottom: 12, display: "inline-block" }}>
            ← Back to dashboard
          </Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: 0, color: "var(--color-forest)", fontWeight: 700 }}>
            Moderation Queue
          </h1>
          <p style={{ margin: 0, marginTop: 4, fontSize: 14, color: "var(--role-text-muted)" }}>
            Review reports, verify vendors, moderate content
          </p>
        </header>

        {/* Tabs */}
        <div style={{ marginBottom: "var(--space-3)", borderBottom: "2px solid var(--role-border)", display: "flex", gap: 24 }}>
          <TabButton active={activeTab === "reports"} onClick={() => setActiveTab("reports")} icon={<Flag size={16} />}>
            Reports
          </TabButton>
          <TabButton active={activeTab === "verifications"} onClick={() => setActiveTab("verifications")} icon={<CheckCircle size={16} />}>
            Verifications
          </TabButton>
          <TabButton active={activeTab === "content"} onClick={() => setActiveTab("content")} icon={<AlertCircle size={16} />}>
            Content
          </TabButton>
          <TabButton active={activeTab === "users"} onClick={() => setActiveTab("users")} icon={<User size={16} />}>
            Users
          </TabButton>
          <TabButton active={activeTab === "appeals"} onClick={() => setActiveTab("appeals")} icon={<Inbox size={16} />}>
            Appeals
          </TabButton>
        </div>

        {/* Bulk actions bar */}
        {/* Content */}
        {activeTab === "reports" && (
          <ReportsTab 
            reports={reports} 
            onOpenDetail={setDetailPanelId}
            onAction={handleAction}
          />
        )}

        {activeTab === "verifications" && (
          <VerificationsTab 
            verifications={verifications} 
            onOpenDetail={setDetailPanelId}
            onAction={handleAction}
          />
        )}

        {activeTab === "content" && (
          <>
          <section data-testid="content-tab" style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 8, padding: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px", color: "var(--role-text)" }}>Content Moderation — Reviews</h2>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--role-text-muted)" }}>
              {contentItems.length} reviews · hide removes a review from public display (audited).
            </p>
            {contentItems.length === 0 ? (
              <p style={{ color: "var(--role-text-muted)", fontSize: 14 }}>No reviews yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {contentItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      padding: 12, borderRadius: 8, border: "1px solid var(--role-border)",
                      background: item.status === "hidden" ? "color-mix(in srgb, var(--role-danger) 6%, var(--role-surface))" : "var(--role-surface)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--role-text)" }}>
                        ★ {item.rating} · {"◦".repeat(0)}<span style={{ color: "var(--role-text-muted)", fontWeight: 400 }}>vendor {item.vendorId.slice(0, 8)}</span>
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--role-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.body || "(no text)"}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 11, padding: "3px 8px", borderRadius: 999, fontWeight: 700,
                        color: item.status === "hidden" ? "var(--role-danger)" : "var(--role-accent)",
                        background: item.status === "hidden" ? "color-mix(in srgb, var(--role-danger) 10%, transparent)" : "color-mix(in srgb, var(--role-accent) 10%, transparent)",
                      }}>
                        {item.status === "hidden" ? "HIDDEN" : "VISIBLE"}
                      </span>
                      <button
                        data-testid={`content-${item.status}-${item.id.slice(0, 8)}`}
                        onClick={() => toggleContentStatus(item)}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: 12, fontWeight: 600, fontFamily: "var(--role-font-ui)",
                          padding: "6px 12px", borderRadius: 999, cursor: "pointer",
                          background: item.status === "visible" ? "color-mix(in srgb, var(--role-danger) 8%, transparent)" : "color-mix(in srgb, var(--role-accent) 10%, transparent)",
                          color: item.status === "visible" ? "var(--role-danger)" : "var(--role-accent)",
                          border: `1px solid ${item.status === "visible" ? "color-mix(in srgb, var(--role-danger) 30%, transparent)" : "color-mix(in srgb, var(--role-accent) 30%, transparent)"}`,
                        }}
                      >
                        {item.status === "visible" ? <EyeOff size={14} /> : <Eye size={14} />}
                        {item.status === "visible" ? "Hide" : "Restore"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section data-testid="comments-tab" style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 8, padding: 20, marginTop: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px", color: "var(--role-text)" }}>Comment Moderation</h2>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--role-text-muted)" }}>
              Hide is reversible (audited) and notifies the author with your reason. Hidden comments disappear from the listing publicly.
            </p>
            <CommentsPanel capabilities={capabilities} />
          </section>

          <section data-testid="listings-tab" style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 8, padding: 20, marginTop: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px", color: "var(--role-text)" }}>Listing Moderation</h2>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--role-text-muted)" }}>
              Remove is soft (reversible, audited) and notifies the vendor with your reason. Feature runs 30 days.
            </p>
            <ListingsPanel capabilities={capabilities} />
          </section>
          </>
        )}

        {activeTab === "users" && (
          <UsersPanel capabilities={capabilities} />
        )}

        {activeTab === "appeals" && (
          <section data-testid="appeals-tab" style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 8, padding: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px", color: "var(--role-text)" }}>Appeals</h2>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--role-text-muted)" }}>
              Token-bound appeals submitted via /appeal. Resolve can reinstate the account (admin+); every decision notifies the appellant.
            </p>
            <AppealsPanel onOpenDetail={setDetailPanelId} refreshKey={refreshKey} />
          </section>
        )}

        {/* T10: case detail drawer — opened from Reports target names, Appeals, and Verifications. */}
        {detailPanelId && (
          <CaseDrawer
            caseId={detailPanelId}
            onClose={() => setDetailPanelId(null)}
            onChanged={() => setRefreshKey((k) => k + 1)}
          />
        )}

        {/* Action confirmation modal */}
        {actionModal && (
          <ActionModal
            action={actionModal.action}
            reason={actionReason}
            onReasonChange={setActionReason}
            onConfirm={confirmAction}
            onCancel={() => setActionModal(null)}
          />
        )}
      </div>
    </div>
  );
}

// Tab components
function ReportsTab({ 
  reports, 
  onOpenDetail,
  onAction,
}: {
  reports: Report[];
  onOpenDetail: (id: string) => void;
  onAction: (action: string, id: string) => void;
}) {
  return (
    <div style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 8, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--role-surface-sunken)", borderBottom: "1px solid var(--role-border)" }}>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Target</th>
            <th style={thStyle}>Reporter</th>
            <th style={thStyle}>Category</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} style={{ borderBottom: "1px solid var(--role-surface-sunken)" }}>
              <td style={tdStyle}>
                <span style={{ ...badgeStyle, background: "var(--role-accent-subtle)", color: "var(--role-accent-strong)" }}>
                  {report.type}
                </span>
              </td>
              <td style={tdStyle}>
                <button onClick={() => onOpenDetail(report.id)} style={linkButton}>
                  {report.targetName}
                </button>
              </td>
              <td style={tdStyle}>{report.reporterName}</td>
              <td style={tdStyle}>{report.category}</td>
              <td style={tdStyle}>{formatRelativeTime(report.date)}</td>
              <td style={tdStyle}>
                <span style={getStatusBadge(report.status)}>
                  {report.status}
                </span>
              </td>
              <td style={tdStyle}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onAction("resolve", report.id)} style={actionButtonStyle} title="Resolve">
                    <Check size={16} />
                  </button>
                  <button onClick={() => onAction("dismiss", report.id)} style={actionButtonStyle} title="Dismiss">
                    <X size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VerificationsTab({ 
  verifications, 
  onOpenDetail,
  onAction,
}: {
  verifications: VerificationRequest[];
  onOpenDetail: (id: string) => void;
  onAction: (action: string, id: string) => void;
}) {
  return (
    <div style={{ background: "var(--role-surface)", border: "1px solid var(--role-border)", borderRadius: 8, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--role-surface-sunken)", borderBottom: "1px solid var(--role-border)" }}>
            <th style={thStyle}>Vendor</th>
            <th style={thStyle}>Request Date</th>
            <th style={thStyle}>Info Submitted</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {verifications.map((verification) => (
            <tr key={verification.id} style={{ borderBottom: "1px solid var(--role-surface-sunken)" }}>
              <td style={tdStyle}>
                <Link href={`/vendor/${verification.vendorId}`} style={linkButton}>
                  {verification.vendorName}
                </Link>
              </td>
              <td style={tdStyle}>{formatRelativeTime(verification.requestDate)}</td>
              <td style={tdStyle}>{verification.submittedInfo}</td>
              <td style={tdStyle}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onOpenDetail(verification.id)} style={linkButton} title="Open case detail">
                    Details
                  </button>
                  <button onClick={() => onAction("approve", verification.id)} style={{ ...actionButtonStyle, color: "var(--role-success-text)" }}>
                    <Check size={16} />
                    Approve
                  </button>
                  <button onClick={() => onAction("deny", verification.id)} style={{ ...actionButtonStyle, color: "var(--role-danger)" }}>
                    <X size={16} />
                    Deny
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Reusable components
function TabButton({ 
  active, 
  onClick, 
  icon, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 0",
        background: "transparent",
        border: "none",
        borderBottom: active ? "2px solid var(--role-accent-strong)" : "2px solid transparent",
        color: active ? "var(--role-accent-strong)" : "var(--role-text-muted)",
        cursor: "pointer",
        fontSize: 15,
        fontWeight: active ? 600 : 400,
        transition: "all 120ms ease",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function ActionModal({
  action,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
}: {
  action: string;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--role-surface)",
        borderRadius: 8,
        padding: "var(--space-4)",
        maxWidth: 480,
        width: "90%",
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 16px 0", color: "var(--color-forest)" }}>
          Confirm {action}
        </h2>
        <p style={{ margin: "0 0 16px 0", fontSize: 14, color: "var(--role-text-muted)" }}>
          Please provide a reason for this action. This will be logged in the audit trail.
        </p>
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Enter reason..."
          style={{
            width: "100%",
            minHeight: 100,
            padding: 12,
            fontSize: 14,
            border: "1px solid var(--role-border)",
            borderRadius: 6,
            fontFamily: "var(--font-body)",
            resize: "vertical",
          }}
        />
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ ...secondaryButton, padding: "10px 20px" }}>
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            disabled={!reason.trim()}
            style={{ 
              ...primaryButton, 
              padding: "10px 20px",
              opacity: reason.trim() ? 1 : 0.5,
              cursor: reason.trim() ? "pointer" : "not-allowed",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function getStatusBadge(status: string): React.CSSProperties {
  const colors: Record<string, { bg: string; color: string }> = {
    open: { bg: "#FFF3E0", color: "#E65100" },
    triaged: { bg: "var(--role-accent-subtle)", color: "var(--role-accent-strong)" },
    resolved: { bg: "#E8F5E9", color: "#2E7D32" },
    dismissed: { bg: "var(--role-surface-sunken)", color: "var(--role-text-muted)" },
  };

  const style = colors[status] || colors.open;
  return {
    ...badgeStyle,
    background: style.bg,
    color: style.color,
  };
}

// Styles
const thStyle: React.CSSProperties = {
  padding: 12,
  textAlign: "left",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--role-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tdStyle: React.CSSProperties = {
  padding: 12,
  fontSize: 14,
  color: "var(--color-forest)",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 500,
  textTransform: "capitalize",
};

const linkButton: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--role-accent-strong)",
  textDecoration: "underline",
  cursor: "pointer",
  padding: 0,
  fontSize: 14,
  fontFamily: "inherit",
  textAlign: "left",
};

const actionButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--role-border)",
  borderRadius: 6,
  padding: "6px 12px",
  fontSize: 13,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  color: "var(--role-text-muted)",
  transition: "all 120ms ease",
};

const primaryButton: React.CSSProperties = {
  background: "var(--role-accent-strong)",
  color: "var(--role-on-accent)",
  border: "none",
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  background: "transparent",
  color: "var(--role-text-muted)",
  border: "1px solid var(--role-border)",
  borderRadius: 6,
  fontSize: 14,
  cursor: "pointer",
};
