import Link from "next/link";
import { InfoPageShell } from "@/components/info/InfoPageShell";

export const metadata = {
  title: "For Vendors",
  description: "Sell on Voeq. Reach students across campus.",
};

export default function ForVendorsPage() {
  return (
    <InfoPageShell title="For Vendors" subtitle="Reach students where they already shop.">
      <ul>
        <li>{/* PLACEHOLDER */}</li>
        <li>{/* PLACEHOLDER */}</li>
        <li>{/* PLACEHOLDER */}</li>
      </ul>
      <Link href="/signup" data-testid="for-vendors-cta">
        Get Started
      </Link>
    </InfoPageShell>
  );
}
