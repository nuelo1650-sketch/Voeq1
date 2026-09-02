import { notFound, redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/session";
import { mockConversationRepo, mockVendorRepo, mockIdentityRepo, mockListingsRepo } from "@voeq/data";
import { ConversationView } from "@/components/messaging/ConversationView";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const identity = await getCurrentIdentity();
  if (!identity) redirect(`/login?next=/messages/${id}`);

  const conv = await mockConversationRepo.getById(id);
  if (!conv) notFound();
  if (!conv.participantIds.includes(identity.id)) notFound();

  const otherId = conv.participantIds.find((p) => p !== identity.id) ?? "";
  const other = otherId ? await mockIdentityRepo.getById(otherId) : null;

  // P-A round 45 (listing context): if this conversation was opened FROM a
  // listing, surface it — the vendor/shopper sees WHAT the chat is about
  // (title, price, image) instead of a vague thread. Messages from a storefront
  // (no listingId) stay contextless by design.
  let listingContext: {
    id: string;
    title: string;
    priceMinor: number;
    image: string | null;
  } | null = null;
  if (conv.listingId) {
    const listing = await mockListingsRepo.getById(conv.listingId);
    if (listing) {
      listingContext = {
        id: listing.id,
        title: listing.title,
        priceMinor: listing.priceMinMinor ?? listing.priceMinor ?? 0,
        image: (listing.images ?? [null])[0] ?? null,
      };
    }
  }

  // VS6.11 — read-only mode: suspended vendor can read but not send.
  let readOnly = false;
  let readOnlyReason: string | undefined;
  if (identity.vendorId) {
    const vendor = await mockVendorRepo.getById(identity.vendorId);
    if (vendor?.status === "suspended") {
      readOnly = true;
      readOnlyReason = "Your storefront is suspended. You can read messages but cannot reply.";
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", height: "100dvh", display: "flex", flexDirection: "column" }}>
      <ConversationView
        conversationId={id}
        currentIdentityId={identity.id}
        otherName={other?.name ?? "Someone"}
        otherLastSeen={conv.lastSeen[otherId]}
        readOnly={readOnly}
        readOnlyReason={readOnlyReason}
        listingContext={listingContext}
      />
    </main>
  );
}
