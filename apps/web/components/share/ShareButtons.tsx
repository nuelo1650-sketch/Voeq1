"use client";

import { useEffect, useState } from "react";

interface ShareData {
  canonical: string;
  social: { twitter: string; facebook: string; instagram: string };
  qr: string;
}

/**
 * VS7.21 — Share buttons (Twitter / Facebook / Instagram + QR + copy link).
 * No WhatsApp messaging link (banned). IG points to the canonical link the user
 * pastes into their Story. Fetches share payload from /api/share/vendor.
 */
export function ShareButtons({ vendorId }: { vendorId: string }) {
  const [data, setData] = useState<ShareData | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/share/vendor?vendorId=${encodeURIComponent(vendorId)}`)
      .then((r) => r.json())
      .then((j) => { if (active && j.ok) setData(j as ShareData); else if (active) setError(j.error ?? "load_failed"); })
      .catch(() => active && setError("network_error"));
    return () => { active = false; };
  }, [vendorId]);

  if (error) return <div data-testid="share-error" style={{ color: "var(--role-accent-danger)" }}>Share unavailable</div>;
  if (!data) return <div data-testid="share-loading">Loading share…</div>;

  return (
    <div data-testid="share-buttons" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <a href={data.social.twitter} target="_blank" rel="noopener noreferrer" data-testid="share-twitter"
           style={btn}>Twitter</a>
        <a href={data.social.facebook} target="_blank" rel="noopener noreferrer" data-testid="share-facebook"
           style={btn}>Facebook</a>
        <button type="button" data-testid="share-instagram" style={btn}
          onClick={() => navigator.clipboard?.writeText(data.social.instagram)}>
          Instagram (copy link)
        </button>
      </div>
      <button type="button" data-testid="share-copy" style={btn}
        onClick={() => { navigator.clipboard?.writeText(data.canonical); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
        {copied ? "Copied!" : "Copy link"}
      </button>
      {data.qr && <img src={data.qr} alt="QR code to vendor share link" data-testid="share-qr" width={120} height={120} />}
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid var(--role-border)",
  background: "var(--role-surface)",
  color: "var(--role-text)",
  fontSize: 13,
  cursor: "pointer",
  textDecoration: "none",
};
