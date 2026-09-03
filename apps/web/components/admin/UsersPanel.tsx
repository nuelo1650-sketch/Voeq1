"use client";

import { useState } from "react";
import { Search, ShieldAlert, X, Clock } from "lucide-react";
import type { Capability } from "@voeq/data";

/**
 * Staff batch 1 / task 8 — Users tab: search identities, inspect them, and
 * run the enforcement ladder (warn / suspend / ban / reinstate) from the UI.
 *
 * Read access = audit.read (moderators can look but not touch). The action
 * buttons only render for actors holding account.suspend (admin+). The
 * events timeline shows raw IP only when the server included it (admin+);
 * moderators see kind + time + UA without the IP column.
 */

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  staffRole: string | null;
  intent: string | null;
  accountStatus: string;
  emailVerified: boolean;
  campus: string | null;
  vendorId: string | null;
  suspensionExpiresAt: string | null;
  warningCount: number;
  createdAt: string;
}

interface AuthEventRow {
  event: string;
  at: string;
  userAgent: string | null;
  ip?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: "var(--color-status-open, #1a7f37)",
  pending_verification: "var(--role-text-muted)",
  suspended: "#b45309",
  banned: "var(--color-danger, #b91c1c)",
};

type LadderAction = "warn" | "suspend" | "ban" | "reinstate";

export function UsersPanel({ capabilities }: { capabilities: Capability[] }) {
  const canAct = capabilities.includes("account.suspend");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [events, setEvents] = useState<AuthEventRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setError("Type at least 2 characters.");
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/users?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(String(data.error ?? `Search failed (${res.status})`));
        setUsers(null);
      } else {
        setUsers(data.users as UserRow[]);
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setSearching(false);
    }
  }

  async function openDetail(u: UserRow) {
    setSelected(u);
    setDetailLoading(true);
    setEvents([]);
    try {
      const res = await fetch(`/api/staff/users?id=${encodeURIComponent(u.id)}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        // Refresh the row from the detail payload (status may have self-lifted).
        setSelected(data.user as UserRow);
        setEvents((data.events ?? []) as AuthEventRow[]);
      }
    } catch {
      /* detail is best-effort; the row data already renders */
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={runSearch} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: 11, color: "var(--role-text-muted)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email or name (min 2 chars)"
            aria-label="Search users"
            style={{
              width: "100%",
              padding: "10px 12px 10px 32px",
              borderRadius: 8,
              border: "1px solid var(--role-border)",
              background: "var(--role-surface)",
              color: "var(--role-text)",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            background: "var(--role-accent-strong)",
            color: "var(--role-on-accent)",
            fontSize: 14,
            fontWeight: 600,
            cursor: searching ? "wait" : "pointer",
          }}
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p style={{ color: "var(--color-danger, #b91c1c)", fontSize: 13 }}>{error}</p>}

      {users !== null && !error && (
        users.length === 0 ? (
          <p style={{ color: "var(--role-text-muted)", fontSize: 14 }}>No users match “{query.trim()}”.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--role-text-muted)", borderBottom: "1px solid var(--role-border)" }}>
                  <th style={{ padding: "8px 10px" }}>User</th>
                  <th style={{ padding: "8px 10px" }}>Role</th>
                  <th style={{ padding: "8px 10px" }}>Status</th>
                  <th style={{ padding: "8px 10px" }}>Warnings</th>
                  <th style={{ padding: "8px 10px" }}>Campus</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => openDetail(u)}
                    style={{ borderBottom: "1px solid var(--role-border)", cursor: "pointer" }}
                  >
                    <td style={{ padding: "10px" }}>
                      <div style={{ fontWeight: 600, color: "var(--role-text)" }}>{u.name}</div>
                      <div style={{ color: "var(--role-text-muted)" }}>{u.email}</div>
                    </td>
                    <td style={{ padding: "10px" }}>
                      {u.role}
                      {u.staffRole && <span style={{ marginLeft: 6, fontSize: 11, color: "var(--role-accent-strong)" }}>· {u.staffRole}</span>}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ color: STATUS_COLORS[u.accountStatus] ?? "var(--role-text)", fontWeight: 600 }}>
                        {u.accountStatus}
                      </span>
                      {u.accountStatus === "suspended" && u.suspensionExpiresAt && (
                        <div style={{ fontSize: 11, color: "var(--role-text-muted)" }}>
                          until {new Date(u.suspensionExpiresAt).toUTCString().replace(":00 GMT", " GMT")}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px" }}>{u.warningCount > 0 ? u.warningCount : "—"}</td>
                    <td style={{ padding: "10px", color: "var(--role-text-muted)" }}>{u.campus ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {users === null && !error && (
        <p style={{ color: "var(--role-text-muted)", fontSize: 14 }}>
          Search to find an account, then click a row to inspect it and run enforcement actions.
        </p>
      )}

      {selected && (
        <UserDrawer
          user={selected}
          events={events}
          loading={detailLoading}
          canAct={canAct}
          onClose={() => setSelected(null)}
          onRefresh={() => openDetail(selected)}
        />
      )}
    </div>
  );
}

function UserDrawer({
  user,
  events,
  loading,
  canAct,
  onClose,
  onRefresh,
}: {
  user: UserRow;
  events: AuthEventRow[];
  loading: boolean;
  canAct: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [action, setAction] = useState<LadderAction | null>(null);
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function submit() {
    if (!action) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/staff/account-action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetIdentityId: user.id,
          action,
          reason,
          ...(action === "suspend" ? { expiresAt } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMsg({ kind: "ok", text: `${labelFor(action)} applied — user notified.` });
        setAction(null);
        setReason("");
        setExpiresAt("");
        onRefresh();
      } else {
        setMsg({ kind: "err", text: String(data.error ?? `Failed (${res.status})`) });
      }
    } catch {
      setMsg({ kind: "err", text: "Network error — action not applied." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-label={`User detail for ${user.email}`}
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
          width: "min(460px, 94vw)",
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
            <h3 style={{ margin: 0, fontSize: 17, color: "var(--role-text)" }}>{user.name}</h3>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--role-text-muted)" }}>{user.email}</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--role-text-muted)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <dl style={{ fontSize: 13, display: "grid", gridTemplateColumns: "110px 1fr", rowGap: 6, margin: "0 0 16px" }}>
          <dt style={{ color: "var(--role-text-muted)" }}>Status</dt>
          <dd style={{ margin: 0, fontWeight: 600, color: STATUS_COLORS[user.accountStatus] ?? "var(--role-text)" }}>
            {user.accountStatus}
            {user.accountStatus === "suspended" && user.suspensionExpiresAt && (
              <span style={{ fontWeight: 400, color: "var(--role-text-muted)" }}>
                {" "}(auto-reinstates {new Date(user.suspensionExpiresAt).toUTCString()})
              </span>
            )}
          </dd>
          <dt style={{ color: "var(--role-text-muted)" }}>Role</dt>
          <dd style={{ margin: 0 }}>{user.role}{user.staffRole ? ` · staff: ${user.staffRole}` : ""}</dd>
          <dt style={{ color: "var(--role-text-muted)" }}>Email verified</dt>
          <dd style={{ margin: 0 }}>{user.emailVerified ? "yes" : "no"}</dd>
          <dt style={{ color: "var(--role-text-muted)" }}>Campus</dt>
          <dd style={{ margin: 0 }}>{user.campus ?? "—"}</dd>
          <dt style={{ color: "var(--role-text-muted)" }}>Vendor</dt>
          <dd style={{ margin: 0, wordBreak: "break-all" }}>{user.vendorId ?? "—"}</dd>
          <dt style={{ color: "var(--role-text-muted)" }}>Warnings</dt>
          <dd style={{ margin: 0 }}>{user.warningCount}</dd>
          <dt style={{ color: "var(--role-text-muted)" }}>Created</dt>
          <dd style={{ margin: 0 }}>{new Date(user.createdAt).toUTCString()}</dd>
        </dl>

        {msg && (
          <p style={{ fontSize: 13, color: msg.kind === "ok" ? "var(--color-status-open, #1a7f37)" : "var(--color-danger, #b91c1c)" }}>{msg.text}</p>
        )}

        {canAct && (
          <div style={{ borderTop: "1px solid var(--role-border)", paddingTop: 14, marginBottom: 18 }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--role-text-muted)", margin: "0 0 8px" }}>
              Enforcement
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(["warn", "suspend", "ban", "reinstate"] as LadderAction[]).map((a) => (
                <button
                  key={a}
                  onClick={() => { setAction(a); setMsg(null); }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: action === a ? "2px solid var(--role-accent-strong)" : "1px solid var(--role-border)",
                    background: a === "ban" && action === a ? "var(--color-danger, #b91c1c)" : "var(--role-surface)",
                    color: a === "ban" && action === a ? "#fff" : "var(--role-text)",
                  }}
                >
                  {labelFor(a)}
                </button>
              ))}
            </div>

            {action && (
              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                {action === "suspend" && (
                  <label style={{ fontSize: 13, color: "var(--role-text)" }}>
                    Suspension ends (required, must be in the future)
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      style={{ display: "block", marginTop: 4, padding: 8, borderRadius: 8, border: "1px solid var(--role-border)", background: "var(--role-surface)", color: "var(--role-text)", width: "100%", boxSizing: "border-box" }}
                    />
                  </label>
                )}
                <label style={{ fontSize: 13, color: "var(--role-text)" }}>
                  Reason (min 20 chars — sent verbatim to the user with appeal instructions)
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    style={{ display: "block", marginTop: 4, padding: 8, borderRadius: 8, border: "1px solid var(--role-border)", background: "var(--role-surface)", color: "var(--role-text)", width: "100%", boxSizing: "border-box", fontSize: 13 }}
                  />
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={submit}
                    disabled={busy || reason.trim().length < 20 || (action === "suspend" && !expiresAt)}
                    style={{
                      padding: "9px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: action === "ban" ? "var(--color-danger, #b91c1c)" : "var(--role-accent-strong)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      opacity: busy || reason.trim().length < 20 || (action === "suspend" && !expiresAt) ? 0.5 : 1,
                    }}
                  >
                    {busy ? "Applying…" : `Confirm ${labelFor(action)}`}
                  </button>
                  <button onClick={() => setAction(null)} style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid var(--role-border)", background: "transparent", color: "var(--role-text)", fontSize: 13, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
                {action === "ban" && (
                  <p style={{ fontSize: 12, color: "var(--color-danger, #b91c1c)", display: "flex", gap: 6, alignItems: "center", margin: 0 }}>
                    <ShieldAlert size={14} /> Ban revokes all sessions immediately and blocks re-registration on this email.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ borderTop: "1px solid var(--role-border)", paddingTop: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--role-text-muted)", margin: "0 0 8px" }}>
            Auth activity {loading && "· loading…"}
          </p>
          {events.length === 0 && !loading && (
            <p style={{ fontSize: 13, color: "var(--role-text-muted)", margin: 0 }}>No recorded auth events for this account.</p>
          )}
          <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: 13 }}>
            {events.map((e, i) => (
              <li key={i} style={{ padding: "7px 0", borderBottom: "1px solid var(--role-border)" }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", fontWeight: 600, color: "var(--role-text)" }}>
                  <Clock size={13} style={{ color: "var(--role-text-muted)" }} /> {e.event}
                </div>
                <div style={{ color: "var(--role-text-muted)", fontSize: 12, marginTop: 2 }}>
                  {new Date(e.at).toUTCString()}
                  {e.ip ? ` · ${e.ip}` : ""}
                </div>
                {e.userAgent && (
                  <div style={{ color: "var(--role-text-muted)", fontSize: 11, marginTop: 1, wordBreak: "break-all" }}>{e.userAgent}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function labelFor(a: LadderAction): string {
  return a === "warn" ? "Warn" : a === "suspend" ? "Suspend" : a === "ban" ? "Ban" : "Reinstate";
}
