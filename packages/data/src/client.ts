/**
 * CLIENT BARREL (bundle fix, 2026-09-05): pure, STANDALONE values that client
 * components need at RUNTIME. This module must never import anything that
 * (transitively) reaches @voeq/db, drizzle, or neon — importing from the
 * package ROOT drags the entire server data layer into the browser bundle
 * (~640KB of drizzle + ASN.1/neon crypto shipped to phones; the chunks that
 * produced TBT 8,290ms / LCP 9.4s / 2.2MB unused JS on the real-device audit).
 *
 * Single-source rule: the seed taxonomy + slug maps re-export from
 * ./explore-view (import-free by design). isOpenNow and the vendor-agreement
 * constants are DEFINED here (pure) and re-exported by ./analytics and
 * ./auth so server code shares the same single source — dependency direction
 * is barrel → pure modules, never the reverse.
 *
 * Rule going forward: any "use client" file that needs a RUNTIME value from
 * @voeq/data imports it from "@voeq/data/client". Type-only imports from the
 * root are fine (erased at compile).
 */
import { categories, CATEGORY_ID_TO_SLUG, CATEGORY_SLUG_TO_ID } from "./explore-view";
import type { Vendor } from "./interfaces";

export { categories, CATEGORY_ID_TO_SLUG, CATEGORY_SLUG_TO_ID };
export type { Vendor };

/** Pure hours-of-operation check (moved from analytics.ts — single source). */
export function isOpenNow(hours: Vendor["hours"]): boolean | null {
  if (!hours || !hours.days || hours.days.length === 0) return null;
  const now = new Date();
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  const today = dayNames[now.getDay()];
  if (!hours.days.includes(today)) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = hours.open.split(":").map(Number);
  const [ch, cm] = hours.close.split(":").map(Number);
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;
  if (closeMin <= openMin) return false; // midnight-wrap unsupported → closed
  return cur >= openMin && cur < closeMin;
}

/** Vendor agreement (pure literals — moved from auth.ts — single source). */
export const CURRENT_VENDOR_AGREEMENT_VERSION = "2026-08-01";
export const VENDOR_AGREEMENT_TEXT = `Voeq Vendor Agreement (v${CURRENT_VENDOR_AGREEMENT_VERSION})

1. You are responsible for the accuracy of your business information, listings, and pricing.
2. All transactions are between you and the buyer; Voeq is a discovery and communication platform.
3. You will not use Voeq to list prohibited, fraudulent, or misleading goods or services.
4. You agree to respond to messages from shoppers in good faith and within a reasonable time.
5. Voeq may suspend or remove your storefront for violations of this agreement or community standards.
6. You retain ownership of your content; you grant Voeq a license to display it on the platform.`;
