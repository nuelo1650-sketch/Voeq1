"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, Heart, UserPlus, AlertCircle, Bell, Trash2 } from "lucide-react";

interface Notification {
  id: string;
  type: "message" | "review" | "follower" | "system" | "all";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  refId?: string;
}

type FilterType = "all" | "unread" | "message" | "review" | "follower" | "system";

/**
 * /notifications — K3a.4 enhanced full notification list with filter tabs,
 * bulk actions, date grouping, pagination. Auth-gated client view.
 */
export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [filteredItems, setFilteredItems] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Load notifications
  async function load() {
    const r = await fetch("/api/notifications");
    if (r.ok) {
      const d = await r.json();
      setItems(d.notifications || []);
    }
    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, []);

  // Apply filter
  useEffect(() => {
    let filtered = items;
    
    if (activeFilter === "unread") {
      filtered = items.filter((n) => !n.read);
    } else if (activeFilter !== "all") {
      filtered = items.filter((n) => n.type === activeFilter);
    }
    
    setFilteredItems(filtered);
    setSelectedIds(new Set());
  }, [items, activeFilter]);

  const unreadCount = items.filter((n) => !n.read).length;
  const displayedItems = filteredItems.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = filteredItems.length > displayedItems.length;

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setItems((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setItems((p) => p.map((n) => ({ ...n, read: true })));
  };

  const markSelectedRead = async () => {
    await Promise.all(Array.from(selectedIds).map((id) => 
      fetch(`/api/notifications/${id}/read`, { method: "PATCH" })
    ));
    setItems((p) => p.map((n) => (selectedIds.has(n.id) ? { ...n, read: true } : n)));
    setSelectedIds(new Set());
  };

  const deleteSelected = async () => {
    await Promise.all(Array.from(selectedIds).map((id) =>
      fetch(`/api/notifications/${id}`, { method: "DELETE" })
    ));
    setItems((p) => p.filter((n) => !selectedIds.has(n.id)));
    setSelectedIds(new Set());
    setDeleteModalOpen(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedItems.map((n) => n.id)));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageCircle size={18} style={{ color: "var(--color-forest-mid)" }} />;
      case "review":
        return <Heart size={18} style={{ color: "var(--color-amber)" }} />;
      case "follower":
        return <UserPlus size={18} style={{ color: "var(--color-forest-light)" }} />;
      case "system":
        return <AlertCircle size={18} style={{ color: "var(--color-ink-muted)" }} />;
      default:
        return <Bell size={18} style={{ color: "var(--color-ink-muted)" }} />;
    }
  };

  const groupByDate = (notifications: Notification[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: Record<string, Notification[]> = {
      Today: [],
      Yesterday: [],
      "This week": [],
      Earlier: [],
    };

    notifications.forEach((notif) => {
      const date = new Date(notif.createdAt);
      if (date >= today) groups.Today.push(notif);
      else if (date >= yesterday) groups.Yesterday.push(notif);
      else if (date >= weekAgo) groups["This week"].push(notif);
      else groups.Earlier.push(notif);
    });

    return groups;
  };

  const groupedItems = groupByDate(displayedItems);

  const getEmptyMessage = () => {
    switch (activeFilter) {
      case "unread":
        return "No unread notifications";
      case "message":
        return "No message notifications";
      case "review":
        return "No review notifications";
      case "follower":
        return "No follower notifications";
      case "system":
        return "No system notifications";
      default:
        return "You're all caught up";
    }
  };

  return (
    <main
      data-testid="notifications-page"
      style={{
        minHeight: "100vh",
        background: "var(--color-glass-white)",
        padding: "var(--space-3) var(--nav-inline-pad) var(--space-8)",
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: "var(--space-4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 36,
              margin: 0,
              color: "var(--color-forest)",
            }}
          >
            Notifications
            {unreadCount > 0 && (
              <span style={{ fontSize: 24, color: "var(--color-ink-muted)", marginLeft: 12 }}>
                ({unreadCount})
              </span>
            )}
          </h1>
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            borderBottom: "1px solid var(--color-ink-subtle)",
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          <FilterTab label="All" active={activeFilter === "all"} onClick={() => setActiveFilter("all")} />
          <FilterTab label="Unread" active={activeFilter === "unread"} onClick={() => setActiveFilter("unread")} count={unreadCount} />
          <FilterTab label="Messages" active={activeFilter === "message"} onClick={() => setActiveFilter("message")} />
          <FilterTab label="Reviews" active={activeFilter === "review"} onClick={() => setActiveFilter("review")} />
          <FilterTab label="Followers" active={activeFilter === "follower"} onClick={() => setActiveFilter("follower")} />
          <FilterTab label="System" active={activeFilter === "system"} onClick={() => setActiveFilter("system")} />
        </div>
      </header>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            background: "var(--color-cream)",
            border: "1px solid var(--color-ink-subtle)",
            borderRadius: 8,
            marginBottom: "var(--space-3)",
          }}
          data-testid="bulk-action-bar"
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-forest)" }}>
            {selectedIds.size} selected
          </span>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={markSelectedRead}
              style={{
                padding: "6px 12px",
                fontSize: 14,
                background: "var(--color-forest)",
                color: "var(--color-cream)",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 500,
              }}
              data-testid="bulk-mark-read"
            >
              Mark as read
            </button>
            <button
              onClick={() => setDeleteModalOpen(true)}
              style={{
                padding: "6px 12px",
                fontSize: 14,
                background: "transparent",
                color: "var(--color-amber-dark)",
                border: "1px solid var(--color-amber-dark)",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              data-testid="bulk-delete"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {!loaded ? (
        <LoadingSkeleton />
      ) : filteredItems.length === 0 ? (
        <EmptyState message={getEmptyMessage()} />
      ) : (
        <div>
          {Object.entries(groupedItems).map(([group, notifs]) =>
            notifs.length > 0 ? (
              <div key={group} style={{ marginBottom: "var(--space-4)" }}>
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--color-ink-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  {group}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {notifs.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      selected={selectedIds.has(notif.id)}
                      onToggleSelect={() => toggleSelect(notif.id)}
                      onMarkRead={() => markRead(notif.id)}
                      icon={getNotificationIcon(notif.type)}
                    />
                  ))}
                </div>
              </div>
            ) : null
          )}

          {/* Load more */}
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "var(--space-4)" }}>
              <button
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: "10px 24px",
                  fontSize: 14,
                  fontWeight: 500,
                  background: "var(--color-cream)",
                  color: "var(--color-forest)",
                  border: "1px solid var(--color-ink-subtle)",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
                data-testid="load-more"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}

      {/* Select all checkbox (if items exist) */}
      {displayedItems.length > 0 && (
        <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-ink-subtle)" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
            <input
              type="checkbox"
              checked={selectedIds.size === displayedItems.length && displayedItems.length > 0}
              onChange={toggleSelectAll}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ color: "var(--color-ink-muted)" }}>
              Select all on this page
            </span>
          </label>
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
            <h3
              style={{
                fontSize: 20,
                fontWeight: 600,
                marginBottom: 12,
                color: "var(--color-forest)",
                fontFamily: "var(--font-display)",
              }}
            >
              Delete {selectedIds.size} notification{selectedIds.size > 1 ? "s" : ""}?
            </h3>
            <p style={{ fontSize: 14, color: "var(--color-ink-muted)", marginBottom: 20 }}>
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
                onClick={deleteSelected}
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: "var(--space-4)" }}>
        <Link href="/home" style={{ color: "var(--color-forest-mid)", textDecoration: "none", fontSize: 14 }}>
          ← Back to dashboard
        </Link>
      </div>
    </main>
  );
}

// Helper components

function FilterTab({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        fontSize: 14,
        fontWeight: 500,
        background: "transparent",
        color: active ? "var(--color-forest)" : "var(--color-ink-muted)",
        border: "none",
        borderBottom: active ? "2px solid var(--color-forest)" : "2px solid transparent",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
      data-testid={`filter-${label.toLowerCase()}`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          style={{
            marginLeft: 6,
            background: "var(--color-forest-light)",
            color: "var(--color-cream)",
            borderRadius: 999,
            padding: "2px 6px",
            fontSize: 12,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function NotificationItem({
  notification,
  selected,
  onToggleSelect,
  onMarkRead,
  icon,
}: {
  notification: Notification;
  selected: boolean;
  onToggleSelect: () => void;
  onMarkRead: () => void;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "16px",
        background: notification.read ? "var(--color-cream)" : "var(--color-glass-white)",
        border: "1px solid var(--color-ink-subtle)",
        borderLeft: notification.read ? "1px solid var(--color-ink-subtle)" : "3px solid var(--color-forest)",
        borderRadius: 8,
        cursor: notification.read ? "default" : "pointer",
      }}
      onClick={() => !notification.read && onMarkRead()}
      data-testid="notification-item"
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2 }}
      />
      <div style={{ flexShrink: 0, marginTop: 2 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 4,
          }}
        >
          <strong
            style={{
              fontSize: 14,
              fontWeight: notification.read ? 500 : 600,
              color: "var(--color-forest)",
            }}
          >
            {notification.title}
            {!notification.read && (
              <span
                style={{
                  display: "inline-block",
                  marginLeft: 8,
                  padding: "2px 6px",
                  background: "var(--color-forest)",
                  color: "var(--color-cream)",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                New
              </span>
            )}
          </strong>
          <span style={{ fontSize: 12, color: "var(--color-ink-subtle)", whiteSpace: "nowrap" }}>
            {new Date(notification.createdAt).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
        <p style={{ fontSize: 14, color: "var(--color-ink-muted)", margin: "0 0 8px" }}>
          {notification.body}
        </p>
        {notification.refId && (
          <Link
            href={notification.refId}
            style={{ fontSize: 13, color: "var(--color-forest-mid)", fontWeight: 500, textDecoration: "none" }}
            onClick={(e) => e.stopPropagation()}
          >
            View →
          </Link>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            height: 100,
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
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      data-testid="notifications-empty"
      style={{
        textAlign: "center",
        padding: "var(--space-8)",
        color: "var(--color-ink-muted)",
      }}
    >
      <Bell size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
      <p style={{ fontSize: 16, margin: 0 }}>{message}</p>
    </div>
  );
}
