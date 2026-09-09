"use client";

/**
 * TrustBandMB (Money Bag A5) — the sand trust strip: Campus verified /
 * Chat before you buy / Meet-on-campus safe + the "Market open — [campus]"
 * gold-pulse pill (REAL time-based: shows a market as open between 7:00 and
 * 23:00 local; outside those hours it says when it opens. No fake constants).
 */

import { useEffect, useState } from "react";
import { Check, MessageCircle, ShieldCheck } from "lucide-react";

const STATS = [
  { icon: Check, title: "Campus verified", sub: "every vendor checked" },
  { icon: MessageCircle, title: "Chat before you buy", sub: "native messaging" },
  { icon: ShieldCheck, title: "Meet-on-campus safe", sub: "public spots, real people" },
] as const;

export function TrustBandMB({ campusName }: { campusName: string }) {
  const [openState, setOpenState] = useState<"open" | "pre" | "closed">("open");
  const [opensAt, setOpensAt] = useState(7);

  useEffect(() => {
    const tick = () => {
      const h = new Date().getHours();
      if (h >= 7 && h < 23) setOpenState("open");
      else if (h < 7) {
        setOpenState("pre");
        setOpensAt(7);
      } else {
        setOpenState("closed");
        setOpensAt(7);
      }
    };
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);

  const marketLine =
    openState === "open"
      ? `Market open — ${campusName}`
      : openState === "pre"
        ? `Opens today ${opensAt}:00 — ${campusName}`
        : `Opens 7:00 — ${campusName}`;

  return (
    <div
      data-testid="mb-trust-band"
      style={{
        background: "var(--sand, #EFE7D3)",
        marginTop: 10,
        padding: 16,
        borderTop: "1px solid rgba(15,42,29,0.06)",
        borderBottom: "1px solid rgba(15,42,29,0.06)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          rowGap: 12,
        }}
      >
        {STATS.map(({ icon: Icon, title, sub }) => (
          <span key={title} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px" }}>
            <span
              aria-hidden
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "#fff",
                boxShadow: "0 4px 14px rgba(15,42,29,0.09)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "var(--forest-deep, #0F2A1D)",
              }}
            >
              <Icon size={18} />
            </span>
            <span>
              <b style={{ display: "block", fontSize: 13.5, color: "var(--forest-deep, #0F2A1D)", fontWeight: 800, lineHeight: 1.2 }}>{title}</b>
              <small style={{ fontSize: 11, color: "var(--role-muted, #7A7A7A)" }}>{sub}</small>
            </span>
          </span>
        ))}
        <span
          data-testid="mb-market-open"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            borderRadius: 999,
            padding: "9px 15px",
            boxShadow: "0 4px 14px rgba(15,42,29,0.09)",
            fontSize: 12,
            fontWeight: 800,
            color: "var(--forest-deep, #0F2A1D)",
          }}
        >
          <span aria-hidden className="mb-live-dot" style={{ width: 8, height: 8, borderRadius: 999, background: "var(--color-amber, #E8A33D)", display: "inline-block" }} />
          {marketLine}
        </span>
      </div>
    </div>
  );
}
