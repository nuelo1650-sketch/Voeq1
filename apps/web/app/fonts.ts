/**
 * Font binding — SINGLE point of font configuration (founder requirement: fonts are
 * PROVISIONAL per Doc 05 B.2; replacing them must be trivial, never a hidden lock).
 *
 * To swap the typeface family: change ONLY the two `next/font/google` imports below.
 * The rest of the app consumes them via CSS variables (--font-fraunces / --font-hanken),
 * which the design-tokens package maps to --role-font-display / --role-font-ui. No
 * component hardcodes a font family.
 */
import { Fraunces, Hanken_Grotesk } from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  weight: ["400", "600"],
});

export const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken",
  weight: ["400", "600"],
});
