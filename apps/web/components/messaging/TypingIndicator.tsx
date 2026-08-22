"use client";

/** VS6.15 — Typing indicator (mock-based: animated dots). */
export function TypingIndicator({ name }: { name: string }) {
  return (
    <div data-testid="typing-indicator" style={{ display: "flex", alignItems: "center", gap: 6, padding: 4, color: "var(--role-muted)", fontSize: 13 }}>
      <style>{`@keyframes voeq-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }`}</style>
      <span>{name} is typing</span>
      <span style={{ display: "inline-flex", gap: 2 }}>
        <Dot delay="0s" />
        <Dot delay="0.15s" />
        <Dot delay="0.3s" />
      </span>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      style={{
        width: 4,
        height: 4,
        borderRadius: "50%",
        background: "currentColor",
        display: "inline-block",
        animation: `voeq-bounce 1s infinite ${delay}`,
      }}
    />
  );
}
