/** VS7.5 — real-number stat card. No fake metrics; value is always a derived string. */
export function StatCard({ label, value, trend }: { label: string; value: string; trend?: string }) {
  return (
    <div data-testid="stat-card" style={{ border: "1px solid var(--role-border)", borderRadius: 8, padding: 12, background: "var(--role-surface)" }}>
      <div style={{ fontSize: 12, color: "var(--role-muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{value}</div>
      {trend && <div style={{ fontSize: 12, color: "var(--role-accent-strong)", marginTop: 2 }}>{trend}</div>}
    </div>
  );
}
