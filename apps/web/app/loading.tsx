/**
 * Default route-loading spinner. Rendered by Next.js while a route segment's
 * data loads. Token-styled to match the app; the keyframe is scoped inline so
 * it works without depending on globals.
 */
export default function Loading() {
  return (
    <div
      data-testid="route-loading"
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: "3px solid var(--color-ink-subtle)",
          borderTopColor: "var(--color-forest)",
          borderRadius: "50%",
          animation: "voeq-spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes voeq-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
