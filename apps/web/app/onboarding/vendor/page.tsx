import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/session";
import { mockVendorRepo } from "@voeq/data";
import { OnboardingWizard } from "./OnboardingWizard";

/**
 * VS3.2 server wrapper + VS3.7 resume support. Loads the vendor already linked to
 * this identity (if any) so the wizard can resume mid-Phase-A instead of starting
 * blind. Phase B progress (photo/listing) lives on the dashboard, not here.
 */
export default async function VendorOnboardingPage() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/login?next=/onboarding/vendor");

  let initialStep = 1;
  let initial = { name: "", description: "", categoryId: "", subArea: "", campusId: "" as string | null };

  if (identity.vendorId) {
    const v = await mockVendorRepo.getById(identity.vendorId);
    if (v) {
      // Resume: jump to the step after whatever is already done.
      if (v.agreementAcceptedAt) initialStep = 4; // Phase A complete -> go to dashboard
      else if (v.campus) initialStep = 3;
      else if (v.name) initialStep = 2;
      initial = {
        name: v.name,
        description: v.description,
        categoryId: v.categoryIds[0] ?? "",
        subArea: v.subArea ?? "",
        campusId: v.campus,
      };
    }
  }

  if (initialStep === 4) redirect("/vendor/dashboard");

  return <OnboardingWizard initialStep={initialStep} initial={initial} />;
}
