/**
 * CampusFingerprint — a contour motif representing a REAL campus's activity shape.
 * Takes `activity` as input; with no real activity it renders a neutral placeholder
 * (no fake campus geography, no invented map). B.11 / A.8: contour meaning requires
 * real-event backing.
 */
export function CampusFingerprint({
  activity,
  className,
  ...rest
}: {
  activity?: number[];
  className?: string;
  [key: string]: unknown;
}) {
  if (!activity || activity.length === 0) {
    return (
      <div
        aria-hidden="true"
        className={className}
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: "1px solid var(--role-border)",
          opacity: 0.12,
        }}
        {...rest}
      />
    );
  }
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 64 64"
      width={64}
      height={64}
      style={{ opacity: 0.7 }}
      {...rest}
    >
      {activity.map((v, i) => {
        // HYDRATION FIX (2026-09-07 render audit): Node (server) and V8
        // (browser) Math.sin/cos differ in the last float bits — cy came out
        // ...475 vs ...479 and React logged a hydration mismatch on every
        // listing page. Rounding to 3dp makes both sides emit identical
        // strings; visually indistinguishable on a 64px motif.
        const angle = (i / activity.length) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={Math.round((32 + Math.cos(angle) * 24) * 1000) / 1000}
            cy={Math.round((32 + Math.sin(angle) * 24) * 1000) / 1000}
            r={Math.round((2 + v * 6) * 1000) / 1000}
            fill="var(--role-accent)"
            opacity={Math.round((0.15 + v * 0.5) * 1000) / 1000}
          />
        );
      })}
    </svg>
  );
}
