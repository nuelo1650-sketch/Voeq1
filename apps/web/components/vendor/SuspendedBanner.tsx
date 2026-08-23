"use client";

import { AlertTriangle, Mail } from "lucide-react";

/**
 * K3b.6 — Suspended state banner.
 * Full-page banner if vendor.status === 'suspended', reason display, all edit forms disabled.
 */

export function SuspendedBanner({ reason }: { reason?: string | null }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "var(--color-cream)",
        zIndex: 9998,
        overflow: "auto",
        padding: "var(--space-4)",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto", paddingTop: "20vh" }}>
        {/* Icon */}
        <div
          style={{
            width: 80,
            height: 80,
            margin: "0 auto 24px",
            background: "#FEE2E2",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AlertTriangle size={40} style={{ color: "#991B1B" }} />
        </div>

        {/* Content */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 36,
              margin: 0,
              color: "#991B1B",
              marginBottom: 16,
            }}
          >
            Account Suspended
          </h1>

          <p
            style={{
              fontSize: 18,
              color: "var(--color-ink)",
              margin: 0,
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Your vendor account has been temporarily suspended.
          </p>

          {/* Reason box */}
          {reason && (
            <div
              style={{
                background: "var(--color-glass-white)",
                border: "2px solid var(--color-ink-subtle)",
                borderRadius: 12,
                padding: "var(--space-4)",
                marginBottom: 32,
                textAlign: "left",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  margin: 0,
                  marginBottom: 12,
                  color: "var(--color-forest)",
                }}
              >
                Reason for suspension
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "var(--color-ink)", lineHeight: 1.7 }}>
                {reason}
              </p>
            </div>
          )}

          {!reason && (
            <div
              style={{
                background: "#FEF3C7",
                border: "1px solid #F59E0B",
                borderRadius: 12,
                padding: "var(--space-3)",
                marginBottom: 32,
              }}
            >
              <p style={{ margin: 0, fontSize: 14, color: "#92400E" }}>
                No specific reason was provided. Please contact support for details.
              </p>
            </div>
          )}

          {/* Action section */}
          <div
            style={{
              background: "var(--color-glass-white)",
              border: "1px solid var(--color-ink-subtle)",
              borderRadius: 12,
              padding: "var(--space-4)",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                margin: 0,
                marginBottom: 16,
                color: "var(--color-forest)",
              }}
            >
              What can I do?
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--color-forest)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: "var(--color-cream)", fontWeight: 700, fontSize: 16 }}>1</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "var(--color-ink)" }}>
                    Review the reason above
                  </p>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--color-ink-muted)", marginTop: 4 }}>
                    Understand what policy violation led to the suspension
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--color-forest)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: "var(--color-cream)", fontWeight: 700, fontSize: 16 }}>2</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "var(--color-ink)" }}>
                    Contact our support team
                  </p>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--color-ink-muted)", marginTop: 4 }}>
                    Submit an appeal or ask for clarification
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--color-forest)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: "var(--color-cream)", fontWeight: 700, fontSize: 16 }}>3</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "var(--color-ink)" }}>
                    Wait for review
                  </p>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--color-ink-muted)", marginTop: 4 }}>
                    Our team will review your case within 3-5 business days
                  </p>
                </div>
              </div>
            </div>

            <a
              href="mailto:support@voeq.ng"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginTop: 24,
                padding: "12px 24px",
                background: "var(--color-forest)",
                color: "var(--color-cream)",
                textDecoration: "none",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                boxShadow: "0 2px 8px rgba(15, 42, 29, 0.2)",
              }}
            >
              <Mail size={18} />
              Contact support
            </a>
          </div>

          <p style={{ fontSize: 13, color: "var(--color-ink-muted)", margin: 0, marginTop: 24 }}>
            All vendor dashboard features are disabled while your account is suspended
          </p>
        </div>
      </div>
    </div>
  );
}
