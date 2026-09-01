import { notFound, redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/session";
import { mockConversationRepo, mockVendorRepo, mockIdentityRepo } from "@voeq/data";
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
      />
    </main>
  );
}
