import { notFound } from "next/navigation";
import { mockVendorRepo } from "@voeq/data";

export const dynamic = "force-dynamic";

/** VS7.20 — Public shareable vendor page at /v/{slug}. */
export default async function VendorSharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vendor = (await mockVendorRepo.listVendors()).find((v) => v.slug === slug);
  if (!vendor) notFound();

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24, fontFamily: "var(--role-font-ui)", textAlign: "center" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h2)" }}>{vendor.name}</h1>
      <p style={{ color: "var(--role-muted)" }}>{vendor.description}</p>
      <p style={{ marginTop: 16 }}>
        {/* P-A round 11 (F03): "Open on Voeq" linked to ITSELF (the /v/{slug}
            share page) — QR/social visitors landed in a dead-end. Now points
            to the live storefront. */}
        <a href={`/vendor/${vendor.id}`} style={{ color: "var(--role-accent-strong)" }}>Open on Voeq</a>
      </p>
      <p style={{ fontSize: 13, color: "var(--role-muted)" }}>Shared from Voeq — campus commerce for Africa.</p>
    </main>
  );
}
