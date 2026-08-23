"use client";

import { useEffect, useState } from "react";
import { Link2, QrCode } from "lucide-react";

interface ShareData {
  canonical: string;
  social: { twitter: string; facebook: string; instagram: string };
  qr: string;
}

// Social media icon components
function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 3.667h-3.533v7.98H9.101z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
    </svg>
  );
}

/**
 * VS7.21 — Share buttons (Twitter / Facebook / Instagram / WhatsApp + QR + copy link).
 * K2.10: Upgraded with branded colors, icons, WhatsApp support, and collapsible QR.
 * Note: WhatsApp SHARE (URL sharing) is allowed. WhatsApp MESSAGING (vendor contact) is banned (Doc 13 §13.13).
 */
export function ShareButtons({ vendorId }: { vendorId: string }) {
  const [data, setData] = useState<ShareData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
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

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check out this vendor on Voeq: ${data.canonical}`)}`;

  return (
    <div data-testid="share-buttons" style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start", maxWidth: 400 }}>
      {/* Primary actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-testid="share-whatsapp"
           style={{ ...btnBase, ...btnWhatsApp }}>
          <WhatsAppIcon />
          WhatsApp
        </a>
        <button type="button" data-testid="share-copy" 
          style={{ ...btnBase, ...btnCopy }}
          onClick={() => { navigator.clipboard?.writeText(data.canonical); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          <Link2 size={16} />
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>

      {/* Secondary social platforms */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href={data.social.twitter} target="_blank" rel="noopener noreferrer" data-testid="share-twitter"
           style={{ ...btnBase, ...btnTwitter }}>
          <TwitterIcon />
          Twitter
        </a>
        <a href={data.social.facebook} target="_blank" rel="noopener noreferrer" data-testid="share-facebook"
           style={{ ...btnBase, ...btnFacebook }}>
          <FacebookIcon />
          Facebook
        </a>
        <button type="button" data-testid="share-instagram" 
          style={{ ...btnBase, ...btnInstagram }}
          onClick={() => navigator.clipboard?.writeText(data.social.instagram)}>
          <InstagramIcon />
          Instagram
        </button>
      </div>

      {/* Collapsible QR code */}
      {data.qr && (
        <div>
          <button 
            type="button" 
            onClick={() => setShowQR(!showQR)}
            style={{ ...btnBase, ...btnSecondary, padding: "6px 12px" }}
            data-testid="share-qr-toggle"
          >
            <QrCode size={16} />
            {showQR ? "Hide QR code" : "Show QR code"}
          </button>
          {showQR && (
            <img 
              src={data.qr} 
              alt="QR code to vendor share link" 
              data-testid="share-qr" 
              width={120} 
              height={120}
              style={{ marginTop: 8, borderRadius: 8, border: "1px solid var(--role-border)" }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Base button style
const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  textDecoration: "none",
  transition: "all 0.2s ease",
};

// Brand colors
const btnWhatsApp: React.CSSProperties = {
  background: "#25D366",
  color: "#FFFFFF",
};

const btnCopy: React.CSSProperties = {
  background: "var(--forest-800)",
  color: "#FFFFFF",
};

const btnTwitter: React.CSSProperties = {
  background: "#1DA1F2",
  color: "#FFFFFF",
};

const btnFacebook: React.CSSProperties = {
  background: "#1877F2",
  color: "#FFFFFF",
};

const btnInstagram: React.CSSProperties = {
  background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)",
  color: "#FFFFFF",
};

const btnSecondary: React.CSSProperties = {
  background: "var(--role-surface)",
  color: "var(--role-text)",
  border: "1px solid var(--role-border)",
};
