"use client";

import { useState, useEffect, useCallback } from "react";
import { Inbox, RotateCcw, Check, X, UserCheck } from "lucide-react";

/**
 * Staff batch 2 / T8 — Appeals queue.
 *
 * Closes the loop T7 opened: an appellant submits via /appeal (token-bound),
 * staff triage here. Resolve can carry reinstate:true (server re-checks the
 * ladder gate — moderators get 403, admins+ don't); dismiss and plain resolve
 * notify the appellant with the decision verbatim.
 *
 * subjectAccountStatus comes from the server (current, not at-submission),
 * so a staff member who reinstated via the Users tab sees it here instantly.
 */

interface AppealCase {
  id: string;
  status: "open" | "triaged" | "resolved" | "dismissed";
  assignedTo?: string | null;
  resolution?: string | null;
  createdAt?: string | null;
  payload?: {
    identityId?: string;
    email?: string;
    accountStatus?: string;
    message?: string;
    submittedAt?: string;
    history?: Array<{ message: string; at: string | null }>;
    reinstateApplied?: boolean;
  } | null;
  subjectAccountStatus?: string;
}

export function AppealsPanel({ onOpenDetail, refreshKey = 0 }: { onOpenDetail?: (id: string) => void; refreshKey?: number }) {
  const [cases, setCases] = useState<AppealCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  // Open decision form: which case, and whether reinstate is ticked.
  const [formId, setFormId] = useState<string | null>(null);
  const [formAction, setFormAction] = useState<"resolve" | "dismiss">("resolve");
  const [reinstate, setReinstate] = useState(true);
  const [resolution, setResolution] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/staff/cases?queue=appeals");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setCases((d.cases as AppealCase[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load appeals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const openForm = (c: AppealCase, action: "resolve" | "dismiss") => {
    setFormId(c.id);
    setFormAction(action);
    setReinstate(action === "resolve");
    setResolution("");
    setError("");
  };

  const submit = async () => {
    if (!formId) return;
    if (resolution.trim().length < 1) {
      setError("A decision note is required — it is shown to the appellant.");
      return;
    }
    setBusyId(formId);
    setError("");
    try {
      const r = await fetch("/api/staff/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: formId,
          action: formAction,
          resolution: resolution.trim(),
          ...(formAction === "resolve" && reinstate ? { reinstate: true } : {}),
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) {
        const code = typeof d.error === "string" ? d.error : `HTTP ${r.status}`;
        setError(
          code === "admin_required"
            ? "Reinstating requires admin or above — your decision was NOT saved."
            : `Failed: ${code}`,
        );
        if (code !== "admin_required") {
          setFormId(null);
          await load();
        }
        return;
      }
      setFormId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusyId(null);
    }
  };

  const assign = async (c: AppealCase) => {
    setBusyId(c.id);
    try {
      await fetch("/api/staff/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: c.id, action: "assign" }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const openCases = cases.filter((c) => c.status === "open" || c.status === "triaged");
  const closedCases = cases.filter((c) => c.status === "resolved" || c.status === "dismissed");

  const statusPill = (s: string | undefined) => {
    const map: Record<string, { bg: string; fg: string; label: string }> = {
      active: { bg: "rgba(34,120,70,0.12)", fg: "#1d6b3c", label: "active" },
      suspended: { bg: "rgba(232,163,61,0.18)", fg: "#8a5a10", label: "suspended" },
      banned: { bg: "rgba(180,40,40,0.12)", fg: "#a02020", label: "banned" },
      deleted: { bg: "rgba(100,100,100,0.12)", fg: "#666", label: "deleted" },
    };
    const t = map[s ?? "unknown"] ?? { bg: "rgba(100,100,100,0.12)", fg: "#666", label: s ?? "unknown" };
    return (
      <span style={{ background: t.bg, color: t.fg, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {t.label}
      </span>
    );
  };

  const renderCase = (c: AppealCase, closed: boolean) => {
    const p = c.payload ?? {};
    const history = Array.isArray(p.history) ? p.history : [];
    const isForm = formId === c.id;
    return (
      <div key={c.id} data-testid="appeal-case" style={{ border: "1px solid var(--role-border)", borderRadius: 8, padding: 16, marginBottom: 12, opacity: closed ? 0.75 : 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 14, color: "var(--role-text)" }}>{p.email ?? "unknown email"}</strong>
          {statusPill(c.subjectAccountStatus)}
          <span style={{ fontSize: 12, color: "var(--role-muted)" }}>
            {p.submittedAt ? new Date(p.submittedAt).toLocaleString() : c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
          </span>
          {history.length > 0 && (
            <span style={{ fontSize: 11, color: "var(--role-muted)" }}>({history.length} earlier {history.length === 1 ? "submission" : "submissions"})</span>
          )}
          {p.reinstateApplied && <span style={{ fontSize: 11, color: "#1d6b3c", fontWeight: 600 }}>reinstated</span>}
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: closed ? "var(--role-muted)" : "#8a5a10", textTransform: "uppercase" }}>{c.status}</span>
        </div>
        {onOpenDetail && (
          <button type="button" onClick={() => onOpenDetail(c.id)} style={{ ...btnStyle("ghost"), marginTop: 8, fontSize: 12 }}>
            Open case file
          </button>
        )}
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--role-text)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{p.message ?? "(no message)"}</p>
        {c.resolution && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--role-muted)" }}>
            <strong>Decision:</strong> {c.resolution}
          </p>
        )}
        {!closed && !isForm && (
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {c.status === "open" && (
              <button type="button" onClick={() => void assign(c)} disabled={busyId === c.id} style={btnStyle("ghost")}>
                <UserCheck size={14} /> {c.assignedTo ? "Reassign to me" : "Assign to me"}
              </button>
            )}
            <button type="button" onClick={() => openForm(c, "resolve")} style={btnStyle("ok")}>
              <Check size={14} /> Resolve
            </button>
            <button type="button" onClick={() => openForm(c, "dismiss")} style={btnStyle("danger")}>
              <X size={14} /> Dismiss
            </button>
          </div>
        )}
        {isForm && (
          <div style={{ marginTop: 12, padding: 12, background: "var(--role-bg, rgba(0,0,0,0.03))", borderRadius: 8 }}>
            {formAction === "resolve" && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--role-text)", marginBottom: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={reinstate} onChange={(e) => setReinstate(e.target.checked)} />
                <RotateCcw size={14} /> Reinstate the account (admin+; they get notified with your note)
              </label>
            )}
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Decision note — shown to the appellant verbatim"
              rows={3}
              style={{ width: "100%", boxSizing: "border-box", borderRadius: 6, border: "1px solid var(--role-border)", padding: 8, fontSize: 13, background: "var(--role-surface)", color: "var(--role-text)" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="button" onClick={() => void submit()} disabled={busyId === c.id} style={btnStyle(formAction === "dismiss" ? "danger" : "ok")}>
                {busyId === c.id ? "Saving…" : formAction === "dismiss" ? "Confirm dismiss" : reinstate ? "Resolve + reinstate" : "Confirm resolve"}
              </button>
              <button type="button" onClick={() => setFormId(null)} style={btnStyle("ghost")}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div data-testid="appeals-panel">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--role-muted)" }}>
          {loading ? "Loading appeals…" : `${openCases.length} open · ${closedCases.length} closed`}
        </p>
        <button type="button" onClick={() => void load()} style={btnStyle("ghost")}>
          Refresh
        </button>
      </div>
      {error && <p style={{ color: "#a02020", fontSize: 13 }}>{error}</p>}
      {!loading && openCases.length === 0 && closedCases.length === 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 24, color: "var(--role-muted)", fontSize: 13 }}>
          <Inbox size={16} /> No appeals — the queue is empty.
        </div>
      )}
      {openCases.map((c) => renderCase(c, false))}
      {closedCases.length > 0 && (
        <>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--role-muted)", margin: "16px 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Closed</h3>
          {closedCases.map((c) => renderCase(c, true))}
        </>
      )}
    </div>
  );
}

function btnStyle(kind: "ok" | "danger" | "ghost"): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 6,
    border: "1px solid var(--role-border)",
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    background: "var(--role-surface)",
    color: "var(--role-text)",
  };
  if (kind === "ok") return { ...base, background: "#1d6b3c", borderColor: "#1d6b3c", color: "#fff" };
  if (kind === "danger") return { ...base, background: "transparent", borderColor: "#a02020", color: "#a02020" };
  return base;
}
