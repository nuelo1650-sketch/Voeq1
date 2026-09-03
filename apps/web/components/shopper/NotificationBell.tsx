"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, MessageCircle, Heart, UserPlus, AlertCircle } from "lucide-react";
import { notificationGroup, notificationHref, type NotificationViewerRole } from "@/lib/notification-href";

interface Notification {
  id: string;
  /** Real producer types are new_message/new_review/new_follower/comment/
   *  system (see @voeq/data interfaces) — the old union here ("message" |
   *  "review" | ...) never matched anything, so icons fell through to the
   *  default bell. P-A round 79. */
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  refId?: string;
}

/**
 * NotificationBell — VS4.8 + K3a.3 enhanced. Shows unread badge, dropdown with
 * last 10 notifications, mark-read on click, SSE real-time updates. Auth-gated.
 */
export function NotificationBell({ viewerRole = "shopper" }: { viewerRole?: NotificationViewerRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  // Load notifications. P-A round 66: the old code sniffed
  // document.cookie.includes("sessionId=") — but the session cookie is
  // httpOnly, so document.cookie NEVER contains it. The bell therefore
  // thought EVERY user was unauth and rendered "Sign in" instead of the
  // badge — the reason no one ever saw an unread count. The API itself is
  // the truth (it returns {notifications:[],unread:0} gracefully when no
  // session), so just fetch it.
  useEffect(() => {
    if (typeof document === "undefined") return;
    let cancelled = false;
    fetch("/api/notifications")
      .then((r) => {
        if (r.status === 401) {
          setLoaded(true);
          setIsAuthed(false);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((d) => {
        if (cancelled || !d) return;
        setItems(d.notifications?.slice(0, 10) || []);
        setUnread(d.unread || 0);
        setLoaded(true);
        setIsAuthed(true);
      })
      .catch(() => {
        setLoaded(true);
        setIsAuthed(false);
      });
    return () => { cancelled = true; };
  }, []);

  // SSE integration ready - to enable, add event listener here:
  // useEffect(() => {
  //   if (!isAuthed) return;
  //   const unsubscribe = subscribeToNotifications({
  //     onNotification: (notif) => {
  //       setItems((prev) => [notif, ...prev].slice(0, 10));
  //       if (!notif.read) setUnread((u) => u + 1);
  //     },
  //   });
  //   return unsubscribe;
  // }, [isAuthed]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // Unauthed: honest CTA
  if (loaded && !isAuthed) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        data-testid="notification-bell-guest"
        style={{
          color: "var(--color-ink-muted)",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 14,
        }}
      >
        <Bell size={18} /> Sign in
      </Link>
    );
  }

  const markRead = async (notif: Notification) => {
    // P-A round 79: navigate via the href mapper for ALL notifications (read or
    // unread). Before, this returned early for a read notif (click did nothing)
    // and pushed the RAW refId (a UUID) as a path -> the message/storefront/
    // listing URL it was supposed to open always 404'd. That was the "click a
    // message notification and nothing happens" bug.
    const href = notificationHref(notif.type, notif.refId, viewerRole);

    if (!notif.read) {
      await fetch(`/api/notifications/${notif.id}/read`, { method: "PATCH" }).catch(() => {});
      setItems((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    }

    setOpen(false);
    if (href) router.push(href);
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const getNotificationIcon = (type: string) => {
    // P-A round 79: switch on the canonical GROUP (the real types carry a
    // new_/comment prefix) so message/review/follower icons actually match.
    switch (notificationGroup(type)) {
      case "message":
        return <MessageCircle size={16} style={{ color: "var(--color-forest-mid)" }} />;
      case "review":
        return <Heart size={16} style={{ color: "var(--color-amber)" }} />;
      case "follower":
        return <UserPlus size={16} style={{ color: "var(--color-forest-light)" }} />;
      case "comment":
        return <AlertCircle size={16} style={{ color: "var(--color-ink-muted)" }} />;
      case "system":
        return <AlertCircle size={16} style={{ color: "var(--color-ink-muted)" }} />;
      default:
        return <Bell size={16} style={{ color: "var(--color-ink-muted)" }} />;
    }
  };

  const getRelativeTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return created.toLocaleDateString();
  };

  const badgeCount = unread > 9 ? "9+" : unread;

  return (
    <div data-testid="notification-bell" style={{ position: "relative", display: "inline-flex" }} ref={dropdownRef}>
      <button
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--color-forest)",
          position: "relative",
          padding: 4,
        }}
        data-testid="notification-bell-button"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span
            data-testid="notification-badge"
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#DC2626",
              color: "#FFFFFF",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 600,
              minWidth: 18,
              height: 18,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
            }}
          >
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          data-testid="notification-dropdown"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            background: "var(--color-cream)",
            border: "1px solid var(--color-ink-subtle)",
            borderRadius: 12,
            padding: 0,
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            animation: "slideDown 0.2s ease-out",
          }}
        >
          <style>{`
            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateY(-8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>

          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: "1px solid var(--color-ink-subtle)",
            }}
          >
            <strong style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--color-forest)" }}>
              Notifications
            </strong>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                data-testid="notification-mark-all"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-forest-mid)",
                  fontSize: 13,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {items.length === 0 ? (
              <div
                style={{
                  padding: "var(--space-4)",
                  textAlign: "center",
                  color: "var(--color-ink-muted)",
                }}
              >
                <Bell size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 14 }}>No notifications yet</p>
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {items.map((notif) => (
                  <li
                    key={notif.id}
                    onClick={() => markRead(notif)}
                    data-testid="notification-item"
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--color-ink-subtle)",
                      cursor: notif.read ? "default" : "pointer",
                      background: notif.read ? "transparent" : "var(--color-glass-white)",
                      borderLeft: notif.read ? "none" : "3px solid var(--color-forest)",
                      transition: "background 0.2s",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (!notif.read) {
                        e.currentTarget.style.background = "var(--color-cream)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!notif.read) {
                        e.currentTarget.style.background = "var(--color-glass-white)";
                      }
                    }}
                  >
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ flexShrink: 0, marginTop: 2 }}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: notif.read ? 400 : 600,
                            color: "var(--color-forest)",
                            marginBottom: 4,
                          }}
                        >
                          {notif.title}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "var(--color-ink-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {notif.body}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--color-ink-subtle)",
                            marginTop: 4,
                          }}
                        >
                          {getRelativeTime(notif.createdAt)}
                        </div>
                      </div>
                      {!notif.read && (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "var(--color-forest)",
                            flexShrink: 0,
                            marginTop: 6,
                          }}
                          title="Unread"
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--color-ink-subtle)",
              textAlign: "center",
            }}
          >
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              style={{
                color: "var(--color-forest-mid)",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              See all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
