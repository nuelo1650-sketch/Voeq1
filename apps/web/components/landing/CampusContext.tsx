/**
 * CampusContext — plumbing for campus context (Doc 04 PG-PUB-001), now an INLINE
 * sentence-skin selector (Chunk 4). Default "NMU" is a PRODUCT DEFAULT, not a claim
 * about the user's real location — we still have no campus service.
 *
 * Locked spec: inline "Discover what's open near [NMU ▾]" — no card, no glassmorphism.
 * Nigerian campuses (NMU default). Conflict B: NMU carries a Kurutie/Okerenkoko zone
 * toggle, rendered inline only when NMU is selected. data-testid="campus-selector"
 * preserved on the <select>; data-testid="campus-context" preserved on the wrapper.
 */
export const CAMPUS_OPTIONS = [
  { id: "nmu", label: "NMU", zones: ["Kurutie", "Okerenkoko"] },
  { id: "unilag", label: "UNILAG" },
  { id: "ui", label: "UI" },
  { id: "oau", label: "OAU" },
  { id: "covenant", label: "Covenant" },
  { id: "futo", label: "FUTO" },
] as const;

type CampusOption = (typeof CAMPUS_OPTIONS)[number];

export function CampusContext({
  campus,
  onCampusChange,
  zone,
  onZoneChange,
}: {
  campus: string;
  onCampusChange: (id: string) => void;
  zone: string;
  onZoneChange: (id: string) => void;
}) {
  const selected = CAMPUS_OPTIONS.find((c) => c.id === campus) ?? CAMPUS_OPTIONS[0];
  const zones = "zones" in selected ? selected.zones : undefined;

  return (
    <div data-testid="campus-context" className="campus-context">
      <p className="campus-context-sentence">
        <span className="campus-context-prefix">Discover what&apos;s open near</span>{" "}
        <span className="campus-context-select-wrap">
          <select
            data-testid="campus-selector"
            className="campus-context-select"
            value={campus}
            onChange={(e) => onCampusChange(e.target.value)}
            aria-label="Campus"
          >
            {CAMPUS_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <span aria-hidden="true" className="campus-context-chevron">
            ▾
          </span>
        </span>
      </p>
      {zones && (
        <div className="zone-toggle" role="group" aria-label="NMU zone">
          {zones.map((z) => (
            <button
              key={z}
              type="button"
              data-active={zone === z ? "true" : "false"}
              aria-pressed={zone === z}
              onClick={() => onZoneChange(z)}
            >
              {z}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
