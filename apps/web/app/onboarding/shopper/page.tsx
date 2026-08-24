import { requireConsent } from "@/lib/session";
import ShopperOnboardingClient from "./ShopperOnboardingClient";

/**
 * VS3.1 + K3a.5 — Shopper onboarding. FIX #2: Now enforces consent acceptance.
 * Server component wrapper that checks auth + consent, then renders client component.
 */
export default async function ShopperOnboardingPage() {
  await requireConsent("/onboarding/shopper");
  return <ShopperOnboardingClient />;
}
