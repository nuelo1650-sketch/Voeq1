"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Bell, MapPin, Shield, AlertTriangle } from "lucide-react";

type Section = "profile" | "notifications" | "campus" | "account";

interface SettingsProps {
  identity: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    campus: string | null;
  };
  initialPrefs: Record<string, "email" | "in_app" | "both" | "off">;
  campuses: { id: string; name: string }[];
  sessions: Array<{ id: string; browser: string; os: string; lastActive: string }>;
}

const NOTIF_TYPES = [
  { key: "messages", label: "Messages" },
  { key: "reviews", label: "Reviews" },
  { key: "new_follower", label: "New followers" },
  { key: "campus_activity", label: "Campus activity" },
  { key: "system", label: "System announcements" },
];

/**
 * SettingsForms — K3a.2 enhanced. Four sections with sidebar/tab navigation,
 * inline save, quiet hours, sessions list, danger zone.
 */
export function SettingsForms({ identity, initialPrefs, campuses, sessions }: SettingsProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [isMobile, setIsMobile] = useState(false);

  // Profile state
  const [name, setName] = useState(identity.name || "");
  const [bio, setBio] = useState("");
  const [profileChanged, setProfileChanged] = useState(false);

  // Notifications state
  const [notifPrefs, setNotifPrefs] = useState(initialPrefs);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("07:00");
  const [notifsChanged, setNotifsChanged] = useState(false);

  // Campus state
  const [selectedCampus, setSelectedCampus] = useState(identity.campus || campuses[0]?.id || "");
  const [subArea, setSubArea] = useState("");
  const [campusChanged, setCampusChanged] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Detect mobile
  useState(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  });

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });
      if (res.ok) {
        showToast("Settings saved");
        setProfileChanged(false);
        router.refresh();
      } else {
        showToast("Could not save settings");
      }
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefs: notifPrefs,
          quietHours: quietHoursEnabled ? { start: quietHoursStart, end: quietHoursEnd } : null,
        }),
      });
      if (res.ok) {
        showToast("Settings saved");
        setNotifsChanged(false);
      } else {
        showToast("Could not save settings");
      }
    } finally {
      setSaving(false);
    }
  };

  const saveCampus = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/campus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campusId: selectedCampus, subArea }),
      });
      if (res.ok) {
        showToast("Settings saved");
        setCampusChanged(false);
        router.refresh();
      } else {
        showToast("Could not save settings");
      }
    } finally {
      setSaving(false);
    }
  };

  const signOutAll = async () => {
    if (!confirm("Sign out of all devices? You'll need to log in again.")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/auth/signout-all", { method: "POST" });
      if (res.ok) {
        router.push("/login");
      } else {
        showToast("Could not sign out");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/delete-account", { method: "DELETE" });
      if (res.ok) {
        router.push("/");
      } else {
        showToast("Could not delete account");
      }
    } finally {
      setSaving(false);
      setDeleteModalOpen(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "var(--space-4)", flexDirection: isMobile ? "column" : "row" }}>
      {/* Sidebar / Tabs */}
      {isMobile ? (
        <div
          style={{
            display: "flex",
            gap: 8,
            borderBottom: "1px solid var(--color-ink-subtle)",
            overflowX: "auto",
          }}
        >
          <TabButton icon={<User size={16} />} label="Profile" active={activeSection === "profile"} onClick={() => setActiveSection("profile")} />
          <TabButton icon={<Bell size={16} />} label="Notifications" active={activeSection === "notifications"} onClick={() => setActiveSection("notifications")} />
          <TabButton icon={<MapPin size={16} />} label="Campus" active={activeSection === "campus"} onClick={() => setActiveSection("campus")} />
          <TabButton icon={<Shield size={16} />} label="Account" active={activeSection === "account"} onClick={() => setActiveSection("account")} />
        </div>
      ) : (
        <nav
          style={{
            minWidth: 200,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <NavButton icon={<User size={18} />} label="Profile" active={activeSection === "profile"} onClick={() => setActiveSection("profile")} />
          <NavButton icon={<Bell size={18} />} label="Notifications" active={activeSection === "notifications"} onClick={() => setActiveSection("notifications")} />
          <NavButton icon={<MapPin size={18} />} label="Campus" active={activeSection === "campus"} onClick={() => setActiveSection("campus")} />
          <NavButton icon={<Shield size={18} />} label="Account" active={activeSection === "account"} onClick={() => setActiveSection("account")} />
        </nav>
      )}

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 600 }}>
        {/* Profile Section */}
        {activeSection === "profile" && (
          <section data-testid="settings-profile">
            <SectionTitle>Profile</SectionTitle>
            <Panel>
              <Field label="Avatar">
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "var(--color-forest-light)",
                    color: "var(--color-cream)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    fontWeight: 600,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {(name || identity.email).charAt(0).toUpperCase()}
                </div>
              </Field>
              <Field label="Name">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setProfileChanged(true);
                  }}
                  style={inputStyle}
                  placeholder="Your name"
                  data-testid="profile-name"
                />
              </Field>
              <Field label="Email">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "var(--color-ink-muted)", fontSize: 14 }}>{identity.email}</span>
                  <button
                    style={{
                      padding: "6px 12px",
                      fontSize: 13,
                      background: "transparent",
                      border: "1px solid var(--color-ink-subtle)",
                      borderRadius: 4,
                      cursor: "pointer",
                      color: "var(--color-forest)",
                    }}
                  >
                    Change email
                  </button>
                </div>
              </Field>
              <Field label="Bio (optional)">
                <textarea
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value);
                    setProfileChanged(true);
                  }}
                  style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "var(--font-body)" }}
                  placeholder="Tell others about yourself"
                  data-testid="profile-bio"
                  maxLength={200}
                />
                <span style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>{bio.length}/200</span>
              </Field>
              <SaveButton onClick={saveProfile} disabled={!profileChanged || saving} />
            </Panel>
          </section>
        )}

        {/* Notifications Section */}
        {activeSection === "notifications" && (
          <section data-testid="settings-notifications">
            <SectionTitle>Notifications</SectionTitle>
            <Panel>
              {NOTIF_TYPES.map((type) => (
                <Field key={type.key} label={type.label}>
                  <select
                    value={notifPrefs[type.key] || "in_app"}
                    onChange={(e) => {
                      setNotifPrefs({ ...notifPrefs, [type.key]: e.target.value as any });
                      setNotifsChanged(true);
                    }}
                    style={inputStyle}
                    data-testid={`notif-${type.key}`}
                  >
                    <option value="in_app">In-app only</option>
                    <option value="email">Email only</option>
                    <option value="both">Both</option>
                    <option value="off">Off</option>
                  </select>
                </Field>
              ))}
              <div style={{ borderTop: "1px solid var(--color-ink-subtle)", paddingTop: "var(--space-3)", marginTop: "var(--space-3)" }}>
                <Field label="Quiet hours">
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={quietHoursEnabled}
                      onChange={(e) => {
                        setQuietHoursEnabled(e.target.checked);
                        setNotifsChanged(true);
                      }}
                      style={{ width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 14 }}>Enable quiet hours</span>
                  </label>
                </Field>
                {quietHoursEnabled && (
                  <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                    <Field label="From">
                      <input
                        type="time"
                        value={quietHoursStart}
                        onChange={(e) => {
                          setQuietHoursStart(e.target.value);
                          setNotifsChanged(true);
                        }}
                        style={{ ...inputStyle, width: 120 }}
                      />
                    </Field>
                    <Field label="To">
                      <input
                        type="time"
                        value={quietHoursEnd}
                        onChange={(e) => {
                          setQuietHoursEnd(e.target.value);
                          setNotifsChanged(true);
                        }}
                        style={{ ...inputStyle, width: 120 }}
                      />
                    </Field>
                  </div>
                )}
              </div>
              <SaveButton onClick={saveNotifications} disabled={!notifsChanged || saving} />
            </Panel>
          </section>
        )}

        {/* Campus Section */}
        {activeSection === "campus" && (
          <section data-testid="settings-campus">
            <SectionTitle>Campus</SectionTitle>
            <Panel>
              <Field label="Current campus">
                <select
                  value={selectedCampus}
                  onChange={(e) => {
                    setSelectedCampus(e.target.value);
                    setCampusChanged(true);
                  }}
                  style={inputStyle}
                  data-testid="campus-select"
                >
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Sub-area (optional)">
                <input
                  type="text"
                  value={subArea}
                  onChange={(e) => {
                    setSubArea(e.target.value);
                    setCampusChanged(true);
                  }}
                  style={inputStyle}
                  placeholder="e.g. North Gate, Engineering Faculty"
                  data-testid="campus-subarea"
                />
              </Field>
              <SaveButton onClick={saveCampus} disabled={!campusChanged || saving} />
            </Panel>
          </section>
        )}

        {/* Account Section */}
        {activeSection === "account" && (
          <section data-testid="settings-account">
            <SectionTitle>Account</SectionTitle>
            <Panel>
              <Field label="Connected accounts">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 14, color: "var(--color-ink)" }}>Email: {identity.email}</span>
                  </div>
                </div>
              </Field>
              <div style={{ borderTop: "1px solid var(--color-ink-subtle)", paddingTop: "var(--space-3)", marginTop: "var(--space-3)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--color-forest)" }}>Active sessions</h3>
                {sessions.length === 0 ? (
                  <p style={{ fontSize: 14, color: "var(--color-ink-muted)" }}>No active sessions</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: 12,
                          background: "var(--color-cream)",
                          borderRadius: 6,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>
                            {session.browser} on {session.os}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>
                            Last active: {session.lastActive}
                          </div>
                        </div>
                        <button
                          style={{
                            padding: "6px 12px",
                            fontSize: 13,
                            background: "transparent",
                            border: "1px solid var(--color-ink-subtle)",
                            borderRadius: 4,
                            cursor: "pointer",
                            color: "var(--color-forest)",
                          }}
                        >
                          Sign out
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={signOutAll}
                  disabled={saving}
                  style={{
                    marginTop: 12,
                    padding: "8px 16px",
                    fontSize: 14,
                    background: "var(--color-forest)",
                    color: "var(--color-cream)",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Sign out all devices
                </button>
              </div>
              <div style={{ borderTop: "1px solid var(--color-amber-dark)", paddingTop: "var(--space-3)", marginTop: "var(--space-4)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "var(--color-amber-dark)", display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={18} />
                  Danger zone
                </h3>
                <p style={{ fontSize: 14, color: "var(--color-ink-muted)", marginBottom: 12 }}>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  style={{
                    padding: "8px 16px",
                    fontSize: 14,
                    background: "transparent",
                    color: "var(--color-amber-dark)",
                    border: "1px solid var(--color-amber-dark)",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                  data-testid="delete-account-button"
                >
                  Delete account
                </button>
              </div>
            </Panel>
          </section>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          data-testid="settings-toast"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            padding: "12px 20px",
            background: "var(--color-forest)",
            color: "var(--color-cream)",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
          }}
        >
          {toast}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            style={{
              background: "var(--color-cream)",
              borderRadius: 12,
              padding: "var(--space-4)",
              maxWidth: 400,
              margin: 20,
            }}
            onClick={(e) => e.stopPropagation()}
            data-testid="delete-modal"
          >
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: "var(--color-forest)", fontFamily: "var(--font-display)" }}>
              Delete account?
            </h3>
            <p style={{ fontSize: 14, color: "var(--color-ink-muted)", marginBottom: 20 }}>
              This will permanently delete:
            </p>
            <ul style={{ fontSize: 14, color: "var(--color-ink-muted)", marginBottom: 20, paddingLeft: 20 }}>
              <li>Your profile and settings</li>
              <li>Saved listings and followed vendors</li>
              <li>Reviews and messages</li>
              <li>All activity history</li>
            </ul>
            <p style={{ fontSize: 14, color: "var(--color-amber-dark)", fontWeight: 500, marginBottom: 20 }}>
              This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteModalOpen(false)}
                style={{
                  padding: "8px 16px",
                  fontSize: 14,
                  background: "transparent",
                  border: "1px solid var(--color-ink-subtle)",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "var(--color-forest)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={saving}
                style={{
                  padding: "8px 16px",
                  fontSize: 14,
                  background: "var(--color-amber-dark)",
                  color: "var(--color-cream)",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
                data-testid="confirm-delete"
              >
                {saving ? "Deleting..." : "Delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "var(--font-display)",
        fontSize: 28,
        marginBottom: "var(--space-3)",
        color: "var(--color-forest)",
      }}
    >
      {children}
    </h2>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--color-cream)",
        border: "1px solid var(--color-ink-subtle)",
        borderRadius: 12,
        padding: "var(--space-3)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 14, fontWeight: 500, color: "var(--color-forest)" }}>{label}</label>
      {children}
    </div>
  );
}

function SaveButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid="save-button"
      style={{
        padding: "10px 20px",
        fontSize: 14,
        fontWeight: 500,
        background: disabled ? "var(--color-ink-subtle)" : "var(--color-forest)",
        color: "var(--color-cream)",
        border: "none",
        borderRadius: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        alignSelf: "flex-start",
        marginTop: 8,
      }}
    >
      Save
    </button>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        fontSize: 14,
        fontWeight: 500,
        background: active ? "var(--color-cream)" : "transparent",
        color: active ? "var(--color-forest)" : "var(--color-ink-muted)",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "10px 16px",
        fontSize: 14,
        fontWeight: 500,
        background: "transparent",
        color: active ? "var(--color-forest)" : "var(--color-ink-muted)",
        border: "none",
        borderBottom: active ? "2px solid var(--color-forest)" : "2px solid transparent",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid var(--color-ink-subtle)",
  borderRadius: 6,
  background: "var(--color-glass-white)",
  color: "var(--color-ink)",
  fontFamily: "var(--font-body)",
  width: "100%",
};
