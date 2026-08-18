import type { Metadata } from "next";
import { fraunces, hankenGrotesk } from "./fonts";
import "@voeq/design-tokens/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voeq — Foundation",
  description: "Voeq Slice 0 global foundation (styleguide).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-env="cream" className={`${fraunces.variable} ${hankenGrotesk.variable}`}>
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
