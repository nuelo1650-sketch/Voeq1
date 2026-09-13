import type { Metadata } from "next";
import { playfair, inter, jetbrainsMono } from "./fonts";
import "@voeq/design-tokens/tokens.css";
import "./globals.css";
import "./mb-explore.css";
import { SmartFooter } from "@/components/shell/SmartFooter";
import { JsonLd, orgJsonLd, websiteJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL("https://voeq.ng"),
  title: {
    default: "Voeq — Find it. Chat it. Get it.",
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
    title: "Voeq — Find it. Chat it. Get it.",
    description:
      "The campus marketplace for Nigerian students. Discover verified vendors, services, and opportunities at your university.",
    // Cut-over SEO (2026-09-11): a share image existed for NOTHING before —
    // WhatsApp/X/Facebook links rendered text-only. Now: 1200x630 brand plate.
    images: [{ url: "/og-voeq.png", width: 1200, height: 630, alt: "Voeq — Find it. Chat it. Get it." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Voeq — Find it. Chat it. Get it.",
    description:
      "The campus marketplace for Nigerian students. Discover verified vendors, services, and opportunities at your university.",
    images: ["/og-voeq.png"],
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
        {/* SEO JSON-LD (2026-09-10): Organization + WebSite(SearchAction) —
            sitelinks searchbox eligibility. Server-built real values only. */}
        <JsonLd data={orgJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
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
        <SmartFooter />
      </body>
    </html>
  );
}
