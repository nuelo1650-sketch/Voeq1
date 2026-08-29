"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

/** Real Voeq channel links (founder-provided 2026-08-29). Do NOT re-derive or drop.
 *  Used in the canonical www.whatsapp.com form so both desktop and mobile apps
 *  resolve to the channel rather than the WhatsApp Business web view. */
const WHATSAPP_URL = "https://www.whatsapp.com/channel/0029Vb8u4Md6mYPON8gMpi3i";
const TIKTOK_HANDLE = "voeq.ng";
const TIKTOK_URL = `https://tiktok.com/@${TIKTOK_HANDLE.replace(/^@/, "")}`;
const INSTAGRAM_HANDLE = "voeq.ng";
const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE.replace(/^@/, "")}`;
const NEWSLETTER_EMAIL = "support@voeq.ng";

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91A9.86 9.86 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.16 8.16 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.25 8.24zm4.52-6.16c-.25-.13-1.47-.72-1.7-.8-.23-.09-.39-.13-.56.12-.17.25-.64.8-.78.97-.14.17-.29.19-.54.06a6.78 6.78 0 0 1-2-1.23 7.5 7.5 0 0 1-1.38-1.72c-.15-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.13.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.3z"/>
    </svg>
  );
}

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .6.05.88.13V9.4a6.33 6.33 0 0 0-5.39 10.69 6.33 6.33 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/>
      <circle cx="12" cy="12" r="4.3"/>
      <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

export function LandingFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    // Wire "Stay in the loop" to support@voeq.ng via a real mailto handoff (the
    // app has no newsletter backend yet). Opens the user's mail client pre-filled.
    window.location.href = `mailto:${NEWSLETTER_EMAIL}?subject=${encodeURIComponent(
      `Voeq newsletter signup`
    )}&body=${encodeURIComponent(`Hi Voeq team,\n\nPlease add me to the newsletter.\n\nEmail: ${email.trim()}`)}`;
    setStatus("done");
    setEmail("");
  };

  return (
    <footer className="landing-footer">
      <div className="footer-content">
        {/* Main 4-column grid */}
        <div className="footer-grid">
          {/* Column 1: brand + socials */}
          <div className="footer-col footer-col--brand">
            <div className="footer-brand">
              <BrandLogo width={94} color="#f6f1e6" className="footer-brand-logo" />
              <p className="footer-brand-tagline">
                The campus marketplace for Nigerian students — find, connect,
                and grow with people on your own campus.
              </p>
            </div>
            <div className="footer-socials">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social"
                aria-label="Voeq on WhatsApp"
                data-testid="footer-social-whatsapp"
              >
                <WhatsAppIcon />
              </a>
              <a
                href={TIKTOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social"
                aria-label="Voeq on TikTok"
                data-testid="footer-social-tiktok"
              >
                <TikTokIcon />
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social"
                aria-label="Voeq on Instagram"
                data-testid="footer-social-instagram"
              >
                <InstagramIcon />
              </a>
            </div>
          </div>

          {/* Column 2: Discover */}
          <div className="footer-col">
            <h4 className="footer-col-title">Discover</h4>
            <Link href="/explore" className="footer-link">Explore</Link>
            <Link href="/explore" className="footer-link">Categories</Link>
            <Link href="/how-it-works" className="footer-link">How it works</Link>
          </div>

          {/* Column 3: Vendors */}
          <div className="footer-col">
            <h4 className="footer-col-title">Vendors</h4>
            <Link href="/for-vendors" className="footer-link">Become a vendor</Link>
            <Link href="/for-vendors#benefits" className="footer-link">Benefits</Link>
            <Link href="/help" className="footer-link">Vendor help</Link>
          </div>

          {/* Column 4: Company + newsletter */}
          <div className="footer-col footer-col--newsletter">
            <h4 className="footer-col-title">Company</h4>
            <Link href="/about" className="footer-link">About us</Link>
            <Link href="/careers" className="footer-link">Careers</Link>
            <Link href="/press" className="footer-link">Press</Link>

            <h4 className="footer-col-title footer-col-title--news">Stay in the loop</h4>
            <p className="footer-newsletter-desc">
              Get campus marketplace updates, vendor tips, and new features
              delivered to your inbox.
            </p>
            {status === "done" ? (
              <p className="footer-newsletter-success">Thanks! Opening your mail app to subscribe…</p>
            ) : (
              <form onSubmit={handleSubscribe} className="footer-newsletter-form">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="footer-newsletter-input"
                  required
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  className="footer-newsletter-btn"
                  aria-label="Subscribe"
                  disabled={status === "sending"}
                >
                  <ArrowRight size={18} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span className="footer-copyright">© 2026 Voeq. All rights reserved. · Powered by Legacy LM</span>
          </div>
          <div className="footer-bottom-right">
            <Link href="/terms" className="footer-legal-link">Terms of Service</Link>
            <Link href="/privacy" className="footer-legal-link">Privacy Policy</Link>
            <Link href="/help" className="footer-legal-link">Help</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
