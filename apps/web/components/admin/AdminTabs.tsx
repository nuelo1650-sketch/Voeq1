"use client";

export interface TabDef {
  key: string;
  label: string;
}

/** VS7.5 — role-based tab strip. Tabs are pre-filtered server-side by capability. */
export function AdminTabs({ tabs, active }: { tabs: TabDef[]; active: string }) {
  return (
    <nav data-testid="admin-tabs" style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {tabs.map((t) => (
        <a
          key={t.key}
          href={`/staff?tab=${t.key}`}
          data-testid={`admin-tab-${t.key}`}
          aria-current={t.key === active ? "page" : undefined}
          style={{
            padding: "8px 14px",
            fontSize: 14,
            fontWeight: t.key === active ? 600 : 400,
            textDecoration: "none",
            color: t.key === active ? "var(--role-accent-strong)" : "var(--role-text)",
            borderBottom: t.key === active ? "2px solid var(--role-accent-strong)" : "2px solid transparent",
          }}
        >
          {t.label}
        </a>
      ))}
    </nav>
  );
}
