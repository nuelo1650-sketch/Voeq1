import { requireConsent } from "@/lib/session";
import SelectCampusClient from "./SelectCampusClient";

/**
 * VS4.7 — Campus selection page. FIX #2: Now enforces consent acceptance.
 * Server component wrapper that checks auth + consent, then renders client component.
 */
export default async function SelectCampusPage() {
  await requireConsent("/select-campus");
  return <SelectCampusClient />;
}

