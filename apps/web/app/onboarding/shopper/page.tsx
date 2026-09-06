import { redirect } from "next/navigation";
import { requireConsent } from "@/lib/session";
import ShopperOnboardingClient from "./ShopperOnboardingClient";

/**
 * VS3.1 + K3a.5 — Shopper onboarding. FIX #2: Now enforces consent acceptance.
 * Server component wrapper that checks auth + consent, then renders client component.
 */
export default async function ShopperOnboardingPage() {
  const identity = await requireConsent("/onboarding/shopper");
  // BUG-1 FIX (2026-09-05): campus is asked BEFORE interest tags — a fresh
  // shopper (B3 path: verify-otp → /home redirect) previously skipped
  // /select-campus entirely and completed onboarding with no campus.
  if (!identity?.campus) redirect("/select-campus");
  return <ShopperOnboardingClient />;
}
