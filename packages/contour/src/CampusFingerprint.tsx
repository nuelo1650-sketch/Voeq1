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
      {activity.map((v, i) => (
        <circle
          key={i}
          cx={32 + Math.cos((i / activity.length) * Math.PI * 2) * 24}
          cy={32 + Math.sin((i / activity.length) * Math.PI * 2) * 24}
          r={2 + v * 6}
          fill="var(--role-accent)"
          opacity={0.15 + v * 0.5}
        />
      ))}
    </svg>
  );
}
