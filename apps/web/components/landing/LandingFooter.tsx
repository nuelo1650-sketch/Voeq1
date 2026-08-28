"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LandingFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="landing-footer">
      <div className="footer-content">
        {/* Main 4-column grid */}
        <div className="footer-grid">
          {/* Column 1: Discover */}
          <div className="footer-col">
            <h4 className="footer-col-title">Discover</h4>
            <Link href="/explore" className="footer-link">Explore</Link>
            <Link href="/explore" className="footer-link">Categories</Link>
            <Link href="/about" className="footer-link">About</Link>
          </div>

          {/* Column 2: Vendors */}
          <div className="footer-col">
            <h4 className="footer-col-title">Vendors</h4>
            <Link href="/for-vendors" className="footer-link">Become a vendor</Link>
            <Link href="/for-vendors#benefits" className="footer-link">Benefits</Link>
            <Link href="/help" className="footer-link">Vendor help</Link>
          </div>

          {/* Column 3: Company */}
          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <Link href="/about" className="footer-link">About us</Link>
            <Link href="/press" className="footer-link">Press</Link>
            <Link href="/careers" className="footer-link">Careers</Link>
            <Link href="/help" className="footer-link">Help center</Link>
          </div>

          {/* Column 4: Newsletter */}
          <div className="footer-col footer-col--newsletter">
            <h4 className="footer-col-title">Stay in the loop</h4>
            <p className="footer-newsletter-desc">
              Get campus marketplace updates, vendor tips, and new features delivered to your inbox.
            </p>
            {subscribed ? (
              <p className="footer-newsletter-success">Thanks! You're subscribed.</p>
            ) : (
              <form onSubmit={handleSubscribe} className="footer-newsletter-form">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="footer-newsletter-input"
                  required
                />
                <button type="submit" className="footer-newsletter-btn" aria-label="Subscribe">
                  <ArrowRight size={18} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span className="footer-copyright">© 2026 Voeq. All rights reserved.</span>
          </div>
          <div className="footer-bottom-right">
            <Link href="/terms" className="footer-legal-link">Terms of Service</Link>
            <Link href="/privacy" className="footer-legal-link">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
