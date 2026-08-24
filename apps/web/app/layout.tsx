import type { Metadata } from "next";
import { playfair, inter, jetbrainsMono } from "./fonts";
import "@voeq/design-tokens/tokens.css";
import "./globals.css";
import { NotificationBell } from "@/components/shopper/NotificationBell";

export const metadata: Metadata = {
  metadataBase: new URL("https://voeq.ng"),
  title: {
    default: "Voeq — Find. Connect. Grow.",
    template: "%s · Voeq",
  },
  description:
    "The campus marketplace for Nigerian students. Discover verified vendors, services, and opportunities at your university.",
  keywords: [
    "campus marketplace",
    "Nigerian students",
    "university marketplace",
    "student vendors",
    "campus services",
    "Voeq",
  ],
  authors: [{ name: "Voeq" }],
  creator: "Voeq",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://voeq.ng",
    siteName: "Voeq",
    title: "Voeq — Find. Connect. Grow.",
    description:
      "The campus marketplace for Nigerian students. Discover verified vendors, services, and opportunities at your university.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Voeq — Find. Connect. Grow.",
    description:
      "The campus marketplace for Nigerian students. Discover verified vendors, services, and opportunities at your university.",
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  alternates: {
    canonical: "https://voeq.ng",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-env="cream" className={`${playfair.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body
        style={{
          margin: 0,
          background: "var(--role-bg)",
          color: "var(--role-text)",
          fontFamily: "var(--role-font-ui)",
          minHeight: "100vh",
        }}
      >
        {children}
        <footer
          data-testid="site-footer"
          style={{
            borderTop: "1px solid var(--role-border)",
            padding: "var(--space-4) var(--nav-inline-pad)",
            color: "var(--role-text-muted)",
            fontSize: "14px",
            background: "var(--role-surface)",
          }}
        >
          <nav aria-label="Footer" style={{ 
            display: "flex", 
            gap: "var(--space-4)", 
            flexWrap: "wrap", 
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "var(--space-2)",
          }}>
            <a 
              href="/become-vendor" 
              data-testid="footer-become-vendor" 
              style={{ 
                color: "var(--role-text-muted)", 
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--role-text)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--role-text-muted)"}
            >
              Become a vendor
            </a>
            <a 
              href="/for-vendors" 
              style={{ 
                color: "var(--role-text-muted)", 
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--role-text)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--role-text-muted)"}
            >
              For Vendors
            </a>
            <a 
              href="/terms" 
              style={{ 
                color: "var(--role-text-muted)", 
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--role-text)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--role-text-muted)"}
            >
              Terms
            </a>
            <NotificationBell />
          </nav>
          <div style={{
            textAlign: "center",
            color: "var(--role-text-muted)",
            fontSize: "13px",
            paddingTop: "var(--space-2)",
            borderTop: "1px solid var(--role-border)",
          }}>
            © 2026 Voeq · Powered by Legacy LM
          </div>
        </footer>
      </body>
    </html>
  );
}
