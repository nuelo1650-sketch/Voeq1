import type { Metadata } from "next";
import { playfair, inter, jetbrainsMono } from "./fonts";
import "@voeq/design-tokens/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voeq — Find. Connect. Grow.",
  description: "The campus marketplace for Nigerian students. Discover verified vendors, services, and opportunities at your university.",
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
      </body>
    </html>
  );
}
