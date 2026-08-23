"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, AlertCircle } from "lucide-react";

/**
 * K3b.6 — Agreement re-consent gate.
 * Full-page gate if vendor.agreementVersion < current, agreement text scrollable,
 * checkbox NOT pre-checked, accept updates version.
 */

const CURRENT_AGREEMENT_VERSION = "2024.1";

const AGREEMENT_TEXT = `
VOEQ VENDOR AGREEMENT
Version ${CURRENT_AGREEMENT_VERSION}
Last updated: January 2024

By accepting this agreement, you agree to:

1. VENDOR RESPONSIBILITIES
   - Provide accurate information about your business and products
   - Maintain up-to-date pricing and availability
   - Respond to customer inquiries in a timely manner
   - Honor all orders and commitments made through the platform

2. PROHIBITED CONTENT
   - No counterfeit or illegal products
   - No discriminatory or harmful content
   - No misleading or false advertising
   - Compliance with all applicable laws and regulations

3. CONTENT GUIDELINES
   - Products must be accurately described
   - Photos must represent actual products
   - Pricing must be clear and honest
   - No spam or manipulative tactics

4. PAYMENT TERMS
   - Standard commission: 10% per transaction
   - Payments processed within 7 business days
   - Refunds handled according to platform policy

5. ACCOUNT SUSPENSION
   - We reserve the right to suspend accounts for violations
   - Vendors will be notified of suspension reasons
   - Appeals can be submitted to support

6. DATA AND PRIVACY
   - Your data is handled according to our Privacy Policy
   - We may use aggregated analytics for platform improvement
   - Customer data must be handled responsibly

7. PLATFORM CHANGES
   - We may update these terms with 30 days notice
   - Continued use constitutes acceptance
   - Material changes require explicit re-consent

8. TERMINATION
   - Either party may terminate with 30 days notice
   - Outstanding obligations must be fulfilled
   - Data export available upon request

For full terms and conditions, visit voeq.ng/terms
For questions, contact support@voeq.ng
`.trim();

export function AgreementGate({ 
  vendorId, 
  currentVersion 
}: { 
  vendorId: string; 
  currentVersion: string | null;
}) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsConsent = !currentVersion || currentVersion !== CURRENT_AGREEMENT_VERSION;

  if (!needsConsent) return null;

  const acceptAgreement = async () => {
    if (!agreed) {
      setError("You must read and agree to the terms");
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const res = await fetch("/api/vendor/agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: CURRENT_AGREEMENT_VERSION }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({ error: "Failed to accept agreement" }));
        setError(data.error);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "var(--color-cream)",
        zIndex: 9999,
        overflow: "auto",
        padding: "var(--space-4)",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: "var(--space-6)", paddingBottom: "var(--space-6)" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-4)" }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 16px",
              background: "var(--color-forest)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileText size={32} style={{ color: "var(--color-cream)" }} />
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, margin: 0, color: "var(--color-forest)" }}>
            Updated Vendor Agreement
          </h1>
          <p style={{ fontSize: 16, color: "var(--color-ink-muted)", margin: 0, marginTop: 12 }}>
            We've updated our vendor agreement. Please review and accept to continue.
          </p>
        </div>

        {/* Agreement text */}
        <div
          style={{
            background: "var(--color-glass-white)",
            border: "1px solid var(--color-ink-subtle)",
            borderRadius: 12,
            padding: "var(--space-4)",
            maxHeight: "60vh",
            overflow: "auto",
            marginBottom: "var(--space-4)",
            fontSize: 14,
            lineHeight: 1.8,
            color: "var(--color-ink)",
            fontFamily: "var(--font-body)",
            whiteSpace: "pre-wrap",
          }}
        >
          {AGREEMENT_TEXT}
        </div>

        {/* Consent checkbox */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "var(--space-3)",
            background: "var(--color-glass-white)",
            border: agreed ? "2px solid var(--color-forest)" : "2px solid var(--color-ink-subtle)",
            borderRadius: 12,
            cursor: "pointer",
            marginBottom: "var(--space-3)",
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ marginTop: 2, width: 20, height: 20, cursor: "pointer" }}
          />
          <span style={{ fontSize: 14, color: "var(--color-ink)", flex: 1 }}>
            I have read and agree to the updated Vendor Agreement (Version {CURRENT_AGREEMENT_VERSION})
          </span>
        </label>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "var(--space-3)",
              background: "#FEE2E2",
              color: "#991B1B",
              borderRadius: 8,
              marginBottom: "var(--space-3)",
            }}
          >
            <AlertCircle size={20} />
            <span style={{ fontSize: 14 }}>{error}</span>
          </div>
        )}

        {/* Accept button */}
        <button
          onClick={acceptAgreement}
          disabled={!agreed || accepting}
          style={{
            width: "100%",
            padding: 16,
            fontSize: 16,
            fontWeight: 600,
            background: !agreed || accepting ? "var(--color-ink-subtle)" : "var(--color-forest)",
            color: "var(--color-cream)",
            border: "none",
            borderRadius: 12,
            cursor: !agreed || accepting ? "not-allowed" : "pointer",
            boxShadow: agreed && !accepting ? "0 4px 12px rgba(15, 42, 29, 0.3)" : "none",
          }}
        >
          {accepting ? "Accepting..." : "Accept and continue"}
        </button>

        <p style={{ fontSize: 12, color: "var(--color-ink-muted)", textAlign: "center", margin: 0, marginTop: 16 }}>
          You must accept the agreement to continue using the vendor dashboard
        </p>
      </div>
    </div>
  );
}
