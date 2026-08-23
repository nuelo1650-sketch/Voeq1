"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, Flag, User, X, Check } from "lucide-react";
import type { Capability } from "@voeq/data";

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

type Tab = "reports" | "verifications" | "content" | "users";

// Mock data structures
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
}

export function ModerationQueue({ staff, capabilities }: ModerationQueueProps) {
  const [activeTab, setActiveTab] = useState<Tab>("reports");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [detailPanelId, setDetailPanelId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{
    action: string;
    itemId: string;
  } | null>(null);
  const [actionReason, setActionReason] = useState("");

  // Mock data
  const mockReports: Report[] = [
    {
      id: "r1",
      type: "listing",
      targetId: "l1",
      targetName: "Suspicious Product Listing",
      reporterName: "John D.",
      category: "Inappropriate Content",
      date: new Date(Date.now() - 2 * 3600000),
      status: "open",
      description: "This listing contains misleading information and potentially fraudulent claims.",
    },
    {
      id: "r2",
      type: "review",
      targetId: "rev1",
      targetName: "Abusive Review",
      reporterName: "Sarah M.",
      category: "Harassment",
      date: new Date(Date.now() - 5 * 3600000),
      status: "triaged",
      description: "Review contains personal attacks and offensive language.",
    },
  ];

  const mockVerifications: VerificationRequest[] = [
    {
      id: "v1",
      vendorId: "vendor1",
      vendorName: "Campus Cafe",
      requestDate: new Date(Date.now() - 24 * 3600000),
      submittedInfo: "Business registration: CAC123456, Operating license attached",
    },
    {
      id: "v2",
      vendorId: "vendor2",
      vendorName: "Tech Repairs Plus",
      requestDate: new Date(Date.now() - 48 * 3600000),
      submittedInfo: "Verified business address, tax ID provided",
    },
  ];

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const selectAll = () => {
    if (activeTab === "reports") {
      setSelectedItems(new Set(mockReports.map(r => r.id)));
    } else if (activeTab === "verifications") {
      setSelectedItems(new Set(mockVerifications.map(v => v.id)));
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleAction = async (action: string, itemId: string) => {
    setActionModal({ action, itemId });
    setActionReason("");
  };

  const confirmAction = async () => {
    if (!actionModal) return;

    console.log("[ModerationQueue] Action:", actionModal.action, "Item:", actionModal.itemId, "Reason:", actionReason);
    
    // In production: POST to API, log to audit
    // await fetch("/api/staff/moderate", { method: "POST", body: JSON.stringify({ ...actionModal, reason: actionReason }) });
    
    setActionModal(null);
    setActionReason("");
    alert(`Action "${actionModal.action}" completed. (Mock)`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5", padding: "var(--space-4)" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <header style={{ marginBottom: "var(--space-4)" }}>
          <Link href="/staff" style={{ fontSize: 14, color: "#1976D2", textDecoration: "none", marginBottom: 12, display: "inline-block" }}>
            ← Back to dashboard
          </Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: 0, color: "#212121", fontWeight: 700 }}>
            Moderation Queue
          </h1>
          <p style={{ margin: 0, marginTop: 4, fontSize: 14, color: "#666" }}>
            Review reports, verify vendors, moderate content
          </p>
        </header>

        {/* Tabs */}
        <div style={{ marginBottom: "var(--space-3)", borderBottom: "2px solid #E0E0E0", display: "flex", gap: 24 }}>
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
        </div>

        {/* Bulk actions bar */}
        {selectedItems.size > 0 && (
          <div style={{
            background: "#1976D2",
            color: "#fff",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {selectedItems.size} selected
            </span>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => alert("Bulk assign (mock)")} style={bulkActionBtn}>
                Assign to me
              </button>
              <button onClick={() => alert("Bulk resolve (mock)")} style={bulkActionBtn}>
                Resolve
              </button>
              <button onClick={() => alert("Bulk dismiss (mock)")} style={bulkActionBtn}>
                Dismiss
              </button>
              <button onClick={clearSelection} style={{ ...bulkActionBtn, background: "transparent", border: "1px solid #fff" }}>
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === "reports" && (
          <ReportsTab 
            reports={mockReports} 
            selectedItems={selectedItems} 
            onToggleSelection={toggleSelection} 
            onSelectAll={selectAll}
            onOpenDetail={setDetailPanelId}
            onAction={handleAction}
          />
        )}

        {activeTab === "verifications" && (
          <VerificationsTab 
            verifications={mockVerifications} 
            selectedItems={selectedItems} 
            onToggleSelection={toggleSelection} 
            onSelectAll={selectAll}
            onAction={handleAction}
          />
        )}

        {activeTab === "content" && (
          <EmptyTab message="Content moderation tab - flagged listings and reviews would appear here" />
        )}

        {activeTab === "users" && (
          <EmptyTab message="User moderation tab - user search and account actions would appear here" />
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
  selectedItems, 
  onToggleSelection, 
  onSelectAll,
  onOpenDetail,
  onAction,
}: {
  reports: Report[];
  selectedItems: Set<string>;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onOpenDetail: (id: string) => void;
  onAction: (action: string, id: string) => void;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E0E0E0", borderRadius: 8, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F5F5F5", borderBottom: "1px solid #E0E0E0" }}>
            <th style={thStyle}>
              <input 
                type="checkbox" 
                onChange={onSelectAll} 
                checked={selectedItems.size === reports.length && reports.length > 0}
                style={{ cursor: "pointer" }}
              />
            </th>
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
            <tr key={report.id} style={{ borderBottom: "1px solid #F5F5F5" }}>
              <td style={tdStyle}>
                <input 
                  type="checkbox" 
                  checked={selectedItems.has(report.id)} 
                  onChange={() => onToggleSelection(report.id)}
                  style={{ cursor: "pointer" }}
                />
              </td>
              <td style={tdStyle}>
                <span style={{ ...badgeStyle, background: "#E3F2FD", color: "#1976D2" }}>
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
  selectedItems, 
  onToggleSelection, 
  onSelectAll,
  onAction,
}: {
  verifications: VerificationRequest[];
  selectedItems: Set<string>;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onAction: (action: string, id: string) => void;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E0E0E0", borderRadius: 8, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F5F5F5", borderBottom: "1px solid #E0E0E0" }}>
            <th style={thStyle}>
              <input 
                type="checkbox" 
                onChange={onSelectAll} 
                checked={selectedItems.size === verifications.length && verifications.length > 0}
                style={{ cursor: "pointer" }}
              />
            </th>
            <th style={thStyle}>Vendor</th>
            <th style={thStyle}>Request Date</th>
            <th style={thStyle}>Info Submitted</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {verifications.map((verification) => (
            <tr key={verification.id} style={{ borderBottom: "1px solid #F5F5F5" }}>
              <td style={tdStyle}>
                <input 
                  type="checkbox" 
                  checked={selectedItems.has(verification.id)} 
                  onChange={() => onToggleSelection(verification.id)}
                  style={{ cursor: "pointer" }}
                />
              </td>
              <td style={tdStyle}>
                <Link href={`/vendor/${verification.vendorId}`} style={linkButton}>
                  {verification.vendorName}
                </Link>
              </td>
              <td style={tdStyle}>{formatRelativeTime(verification.requestDate)}</td>
              <td style={tdStyle}>{verification.submittedInfo}</td>
              <td style={tdStyle}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onAction("approve", verification.id)} style={{ ...actionButtonStyle, color: "#4CAF50" }}>
                    <Check size={16} />
                    Approve
                  </button>
                  <button onClick={() => onAction("deny", verification.id)} style={{ ...actionButtonStyle, color: "#F44336" }}>
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

function EmptyTab({ message }: { message: string }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E0E0E0",
      borderRadius: 8,
      padding: "var(--space-6)",
      textAlign: "center",
      color: "#999",
    }}>
      <p style={{ margin: 0, fontSize: 14 }}>{message}</p>
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
        borderBottom: active ? "2px solid #1976D2" : "2px solid transparent",
        color: active ? "#1976D2" : "#666",
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
        background: "#fff",
        borderRadius: 8,
        padding: "var(--space-4)",
        maxWidth: 480,
        width: "90%",
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 16px 0", color: "#212121" }}>
          Confirm {action}
        </h2>
        <p style={{ margin: "0 0 16px 0", fontSize: 14, color: "#666" }}>
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
            border: "1px solid #E0E0E0",
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
    triaged: { bg: "#E3F2FD", color: "#1976D2" },
    resolved: { bg: "#E8F5E9", color: "#2E7D32" },
    dismissed: { bg: "#F5F5F5", color: "#666" },
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
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tdStyle: React.CSSProperties = {
  padding: 12,
  fontSize: 14,
  color: "#212121",
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
  color: "#1976D2",
  textDecoration: "underline",
  cursor: "pointer",
  padding: 0,
  fontSize: 14,
  fontFamily: "inherit",
  textAlign: "left",
};

const actionButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #E0E0E0",
  borderRadius: 6,
  padding: "6px 12px",
  fontSize: 13,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  color: "#666",
  transition: "all 120ms ease",
};

const bulkActionBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.2)",
  border: "none",
  color: "#fff",
  padding: "6px 14px",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

const primaryButton: React.CSSProperties = {
  background: "#1976D2",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  background: "transparent",
  color: "#666",
  border: "1px solid #E0E0E0",
  borderRadius: 6,
  fontSize: 14,
  cursor: "pointer",
};
