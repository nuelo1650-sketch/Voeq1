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
            padding: "var(--space-3) var(--nav-inline-pad)",
            color: "var(--role-muted)",
            fontSize: "var(--fs-sm)",
          }}
        >
          <nav aria-label="Footer" style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
            <a href="/become-vendor" data-testid="footer-become-vendor" style={{ color: "var(--role-muted)", textDecoration: "none" }}>
              Become a vendor
            </a>
            <a href="/for-vendors" style={{ color: "var(--role-muted)", textDecoration: "none" }}>
              For Vendors
            </a>
            <a href="/terms" style={{ color: "var(--role-muted, var(--role-muted))", textDecoration: "none" }}>
              Terms
            </a>
            <NotificationBell />
          </nav>
        </footer>
      </body>
    </html>
  );
}
