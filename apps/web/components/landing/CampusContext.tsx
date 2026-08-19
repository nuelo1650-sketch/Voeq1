import { Stack, Type, Surface } from "@voeq/ui";

/**
 * CampusContext — plumbing for campus context (Doc 04 PG-PUB-001), now with a REAL
 * selector (Task B Part 1.1). Default "NMU" is a PRODUCT DEFAULT, not a claim about the
 * user's real location — we still have no campus service. Honest-state rule preserved:
 * the block labels the campus as a selected/default view, never "You are at X".
 */
export const CAMPUS_OPTIONS = [
  { id: "nmu", label: "NMU" },
  { id: "up", label: "University of Pretoria" },
  { id: "wits", label: "Wits" },
  { id: "uct", label: "UCT" },
] as const;

export function CampusContext({
  campus,
  onCampusChange,
}: {
  campus: string;
  onCampusChange: (id: string) => void;
}) {
  return (
    <Surface data-testid="campus-context" sunken>
      <Stack space={1}>
        <Type tone="accent" size="sm">
          Campus context
        </Type>
        <label style={{ display: "flex", gap: "var(--space-1)", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--role-font-ui)", fontSize: "14px", color: "var(--role-text)" }}>
            Showing the marketplace near
          </span>
          <select
            data-testid="campus-selector"
            value={campus}
            onChange={(e) => onCampusChange(e.target.value)}
            style={{
              fontFamily: "var(--role-font-ui)",
              fontSize: "14px",
              padding: "4px 8px",
              borderRadius: "var(--radius)",
              border: "1px solid var(--role-border)",
              background: "var(--role-surface)",
              color: "var(--role-text)",
            }}
          >
            {CAMPUS_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <Type tone="muted" size="sm">
          (Default view — campus selection is a product default, not a detected location yet.)
        </Type>
      </Stack>
    </Surface>
  );
}
