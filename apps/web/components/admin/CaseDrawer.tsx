"use client";

import { useState, useEffect, useCallback } from "react";
import { X, UserCheck, RotateCcw, Check, AlertTriangle, Clock, StickyNote } from "lucide-react";

/**
 * Staff batch 2 / T10 — Case drawer.
 *
 * Slide-over that consumes the T9 detail API (GET /api/staff/cases?id=):
 * resolved subject + target, the subject's auth-event timeline since the
 * case opened, internal notes, and every triage action (assign, note,
 * resolve/dismiss — with reinstate on appeals — and reopen for closed
 * cases). The server gates what this shows: raw IPs arrive only for staff
 * with account.suspend, and reinstate is re-checked against the ladder on
 * submit, so a moderator clicking it gets a clear 403 message, not a
 * silent failure.
 */

interface CaseDetail {
  id: string;
  queue: string;
  status: "open" | "triaged" | "resolved" | "dismissed";
  assignedTo?: string | null;
  resolution?: string | null;
  createdAt?: string | null;
  decidedAt?: string | null;
  consequence?: string | null;
  payload?: Record<string, unknown> | null;
}

interface Subject {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  staffRole?: string | null;
  accountStatus?: string;
  deleted?: boolean;
}

interface Target {
  kind: string;
  id: string;
  title?: string;
  name?: string;
  status?: string;
  isPublished?: boolean;
  vendorId?: string;
  missing?: boolean;
}

interface TimelineEvent {
  event: string;
  at: string;
  userAgent: string | null;
  ip?: string | null;
}

interface Note {
  at: string;
  by: string;
  text: string;
}

export function CaseDrawer({
  caseId,
  onClose,
  onChanged,
}: {
  caseId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [theCase, setCase] = useState<CaseDetail | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Small inline success line (separate from error state so it clears on next action).
  const [noteFlash, setNoteFlash] = useState("");

  // Decision form state
  const [formAction, setFormAction] = useState<"resolve" | "dismiss" | null>(null);
  const [resolution, setResolution] = useState("");
  const [reinstate, setReinstate] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [showNote, setShowNote] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/staff/cases?id=${encodeURIComponent(caseId)}`);
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) {
        setError(r.status === 404 ? "Case not found." : `Failed to load case (HTTP ${r.status}).`);
        return;
      }
      setCase(d.case as CaseDetail);
      setSubject((d.subject as Subject | null) ?? null);
      setTarget((d.target as Target | null) ?? null);
      setTimeline((d.timeline as TimelineEvent[]) ?? []);
    } catch {
      setError("Network error loading case.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const post = async (body: Record<string, unknown>, successHint?: string) => {
    setBusy(true);
    setError("");
    setNoteFlash("");
    try {
      const r = await fetch("/api/staff/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, ...body }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) {
        const code = typeof d.error === "string" ? d.error : `HTTP ${r.status}`;
        setError(
          code === "admin_required"
            ? "Reinstating requires admin or above — your decision was NOT saved."
            : `Failed: ${code}`,
        );
        return false;
      }
      if (successHint) setNoteFlash(successHint);
      setFormAction(null);
      setResolution("");
      setShowNote(false);
      setNoteText("");
      await load();
      onChanged();
      return true;
    } catch {
      setError("Network error — action not applied.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Small inline success line (separate from error state so it clears on next action).
  const closed = theCase ? theCase.status === "resolved" || theCase.status === "dismissed" : false;
  const isAppeal = theCase?.queue === "appeals";
  const notes = Array.isArray(theCase?.payload?.notes) ? (theCase?.payload?.notes as Note[]) : [];
  const appealMessage = typeof theCase?.payload?.message === "string" ? (theCase.payload.message as string) : "";

  return (
    <div
      role="dialog"
      aria-label="Case detail"
      data-testid="case-drawer"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(15, 23, 18, 0.45)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 96vw)",
          height: "100%",
          overflowY: "auto",
          background: "var(--role-bg, #fff)",
          borderLeft: "1px solid var(--role-border)",
          padding: 20,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, color: "var(--role-text)" }}>
              {theCase ? `${theCase.queue} case` : "Case"}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--role-text-muted)", wordBreak: "break-all" }}>{caseId}</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--role-text-muted)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {loading && <p style={{ fontSize: 13, color: "var(--role-text-muted)" }}>Loading case…</p>}
        {error && <p data-testid="case-drawer-error" style={{ fontSize: 13, color: "var(--color-danger, #b91c1c)" }}>{error}</p>}
        {noteFlash && !error && <p style={{ fontSize: 13, color: "#1d6b3c" }}>{noteFlash}</p>}

        {theCase && !loading && (
          <>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
              <span style={pill(closed ? "var(--role-text-muted)" : "#8a5a10")}>{theCase.status.toUpperCase()}</span>
              {theCase.assignedTo && <span style={{ fontSize: 12, color: "var(--role-text-muted)" }}>assigned {String(theCase.assignedTo).slice(0, 8)}</span>}
              {theCase.createdAt && <span style={{ fontSize: 12, color: "var(--role-text-muted)" }}>opened {new Date(theCase.createdAt).toLocaleString()}</span>}
            </div>

            {/* Subject */}
            <Section title="Subject">
              {subject ? (
                <dl style={dlStyle}>
                  <dt>Email</dt>
                  <dd>{subject.deleted ? <span style={{ color: "var(--color-danger, #b91c1c)" }}>account deleted ({String(subject.id).slice(0, 8)}…)</span> : subject.email}</dd>
                  {!subject.deleted && (
                    <>
                      <dt>Name</dt>
                      <dd>{subject.name}</dd>
                      <dt>Status</dt>
                      <dd style={{ fontWeight: 600 }}>{subject.accountStatus}</dd>
                      <dt>Role</dt>
                      <dd>{subject.role}{subject.staffRole ? ` · staff: ${subject.staffRole}` : ""}</dd>
                    </>
                  )}
                </dl>
              ) : (
                <p style={{ fontSize: 13, color: "var(--role-text-muted)", margin: 0 }}>No account attached to this case.</p>
              )}
            </Section>

            {/* Target */}
            {target && (
              <Section title="Target">
                <p style={{ margin: 0, fontSize: 13, color: "var(--role-text)" }}>
                  <strong>{target.kind}</strong>{" "}
                  {target.missing ? (
                    <span style={{ color: "var(--color-danger, #b91c1c)" }}>no longer exists ({String(target.id).slice(0, 8)}…)</span>
                  ) : (
                    <>
                      {target.title ?? target.name ?? ""}{" "}
                      <span style={{ color: "var(--role-text-muted)" }}>· {target.status}{typeof target.isPublished === "boolean" ? (target.isPublished ? " · published" : " · unpublished") : ""}</span>
                    </>
                  )}
                </p>
              </Section>
            )}

            {/* Appeal message (appeals queue only) */}
            {isAppeal && appealMessage && (
              <Section title="Appeal statement">
                <p style={{ margin: 0, fontSize: 13, color: "var(--role-text)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{appealMessage}</p>
              </Section>
            )}

            {/* Decision (closed cases) */}
            {theCase.resolution && (
              <Section title="Decision">
                <p style={{ margin: 0, fontSize: 13, color: "var(--role-text)" }}>{theCase.resolution}</p>
              </Section>
            )}

            {/* Notes */}
            <Section title={`Notes (${notes.length})`}>
              {notes.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: "var(--role-text-muted)" }}>No internal notes yet.</p>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {notes.map((n, i) => (
                    <li key={i} style={{ fontSize: 13, color: "var(--role-text)", borderLeft: "2px solid var(--role-border)", paddingLeft: 10 }}>
                      {n.text}
                      <div style={{ fontSize: 11, color: "var(--role-text-muted)", marginTop: 2 }}>
                        {n.at ? new Date(n.at).toLocaleString() : ""} · staff {String(n.by).slice(0, 8)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Timeline */}
            <Section title={`Activity since case opened (${timeline.length})`}>
              {timeline.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: "var(--role-text-muted)" }}>No auth events recorded since the case opened.</p>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {timeline.map((e, i) => (
                    <li key={i} style={{ fontSize: 12, color: "var(--role-text)", display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                      <Clock size={12} style={{ flexShrink: 0, transform: "translateY(2px)", color: "var(--role-text-muted)" }} />
                      <strong>{e.event}</strong>
                      <span style={{ color: "var(--role-text-muted)" }}>{e.at ? new Date(e.at).toLocaleString() : ""}</span>
                      {e.userAgent && <span style={{ color: "var(--role-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{String(e.userAgent).slice(0, 60)}</span>}
                      {e.ip && <code style={{ fontSize: 11, background: "var(--role-surface-sunken, rgba(0,0,0,0.05))", padding: "1px 6px", borderRadius: 4 }}>{e.ip}</code>}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Actions */}
            <div style={{ borderTop: "1px solid var(--role-border)", paddingTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {!closed && (
                <>
                  <button type="button" disabled={busy} onClick={() => void post({ action: "assign" })} style={btn("ghost")}>
                    <UserCheck size={14} /> {theCase.assignedTo ? "Reassign to me" : "Assign to me"}
                  </button>
                  <button type="button" disabled={busy} onClick={() => { setShowNote((v) => !v); setFormAction(null); }} style={btn("ghost")}>
                    <StickyNote size={14} /> Note
                  </button>
                  <button type="button" disabled={busy} onClick={() => { setFormAction("resolve"); setShowNote(false); }} style={btn("ok")}>
                    <Check size={14} /> Resolve
                  </button>
                  <button type="button" disabled={busy} onClick={() => { setFormAction("dismiss"); setShowNote(false); }} style={btn("danger")}>
                    <AlertTriangle size={14} /> Dismiss
                  </button>
                </>
              )}
              {closed && (
                <button type="button" disabled={busy} onClick={() => void post({ action: "reopen" })} style={btn("ghost")}>
                  <RotateCcw size={14} /> Reopen case
                </button>
              )}
            </div>

            {showNote && !closed && (
              <div style={{ marginTop: 10, padding: 12, background: "var(--role-bg, rgba(0,0,0,0.03))", borderRadius: 8 }}>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Internal note — visible to staff only, never to the subject"
                  rows={2}
                  style={{ width: "100%", boxSizing: "border-box", borderRadius: 6, border: "1px solid var(--role-border)", padding: 8, fontSize: 13, background: "var(--role-surface)", color: "var(--role-text)" }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button type="button" disabled={busy || noteText.trim().length < 2} onClick={() => void post({ action: "note", note: noteText.trim() }, "Note added.")} style={btn("ghost")}>
                    {busy ? "Saving…" : "Add note"}
                  </button>
                  <button type="button" onClick={() => setShowNote(false)} style={btn("ghost")}>Cancel</button>
                </div>
              </div>
            )}

            {formAction && !closed && (
              <div style={{ marginTop: 10, padding: 12, background: "var(--role-bg, rgba(0,0,0,0.03))", borderRadius: 8 }}>
                {isAppeal && formAction === "resolve" && (
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--role-text)", marginBottom: 8, cursor: "pointer" }}>
                    <input type="checkbox" checked={reinstate} onChange={(e) => setReinstate(e.target.checked)} />
                    <RotateCcw size={14} /> Reinstate the account (admin+; they get notified with your note)
                  </label>
                )}
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder={formAction === "dismiss" ? "Why this is dismissed — shown to the subject verbatim" : "Your decision — shown to the subject verbatim"}
                  rows={3}
                  style={{ width: "100%", boxSizing: "border-box", borderRadius: 6, border: "1px solid var(--role-border)", padding: 8, fontSize: 13, background: "var(--role-surface)", color: "var(--role-text)" }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    disabled={busy || resolution.trim().length < 1}
                    onClick={() => void post({ action: formAction, resolution: resolution.trim(), ...(formAction === "resolve" && isAppeal && reinstate ? { reinstate: true } : {}) })}
                    style={btn(formAction === "dismiss" ? "danger" : "ok")}
                  >
                    {busy ? "Saving…" : formAction === "dismiss" ? "Confirm dismiss" : isAppeal && reinstate ? "Resolve + reinstate" : "Confirm resolve"}
                  </button>
                  <button type="button" onClick={() => setFormAction(null)} style={btn("ghost")}>Cancel</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 14 }}>
      <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--role-text-muted)", margin: "0 0 6px" }}>{title}</h4>
      {children}
    </section>
  );
}

const dlStyle: React.CSSProperties = { fontSize: 13, display: "grid", gridTemplateColumns: "90px 1fr", rowGap: 4, margin: 0 };

function pill(color: string): React.CSSProperties {
  return { background: "color-mix(in srgb, " + color + " 12%, transparent)", color, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 0.4 };
}

function btn(kind: "ok" | "danger" | "ghost"): React.CSSProperties {
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
