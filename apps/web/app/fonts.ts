/**
 * Font binding — GLASS-WHITE CANVAS SYSTEM (2026-08-21)
 * 
 * NEW DESIGN DIRECTION fonts:
 *   - Display: Playfair Display (elegant serif for headlines)
 *   - Body: Inter (clean, readable sans-serif)
 *   - Mono: JetBrains Mono (code and monospaced elements)
 *
 * To swap the typeface family: change ONLY the `next/font/google` imports below.
 * The rest of the app consumes them via CSS variables (--font-display / --font-body / --font-mono),
 * which the design-tokens package maps to --role-font-display / --role-font-ui / --role-font-mono.
 * No component hardcodes a font family.
 */
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";

export const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500"],
});
