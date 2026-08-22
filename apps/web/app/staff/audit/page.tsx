import { redirect } from "next/navigation";
import { getStaffIdentity } from "@/lib/session";
import { queryAudit, type AuditEntry } from "@voeq/data";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const staff = await getStaffIdentity();
  if (!staff) redirect("/login?next=/staff/audit");

  const entries = await queryAudit({ limit: 100 });
  entries.sort((a: AuditEntry, b: AuditEntry) => b.at.localeCompare(a.at));

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 16, fontFamily: "var(--role-font-ui)" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h2)" }}>Audit Log</h1>
      <p style={{ color: "var(--role-muted)", fontSize: 14 }}>Latest {entries.length} entries (newest first). Identity-referenced only — no PII.</p>
      <table data-testid="audit-log" style={{ width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid var(--role-border)" }}>
            <th style={{ padding: 6 }}>Time</th>
            <th style={{ padding: 6 }}>Type</th>
            <th style={{ padding: 6 }}>Actor</th>
            <th style={{ padding: 6 }}>Admin</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e: AuditEntry) => (
            <tr key={e.id} style={{ borderBottom: "1px solid var(--role-border)" }}>
              <td style={{ padding: 6 }}>{new Date(e.at).toLocaleString()}</td>
              <td style={{ padding: 6 }}>{e.type}</td>
              <td style={{ padding: 6 }}>{e.identityId ?? "—"}</td>
              <td style={{ padding: 6 }}>{e.adminAction ? "yes" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
