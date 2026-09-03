import { redirect } from "next/navigation";
import { getCurrentIdentity, getStaffIdentity } from "@/lib/session";
import { ConversationList, type ConversationRow } from "@/components/messaging/ConversationList";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/login?next=/messages");
  const staff = await getStaffIdentity();

  const { mockConversationRepo, mockMessageRepo, mockIdentityRepo, mockVendorRepo } = await import("@voeq/data");
  const conversations = await mockConversationRepo.listForIdentity(identity.id);
  const rows: ConversationRow[] = await Promise.all(
    conversations.map(async (c) => {
      const otherId = c.participantIds.find((p) => p !== identity.id) ?? "";
      const other = otherId ? await mockIdentityRepo.getById(otherId) : null;
      // P-A round 50: the person's photo lives in TWO places — Identity.avatarUrl
      // (shoppers) and vendors.profilePhotoUrl (vendors). Resolve both so the
      // inbox shows real photos, not always initials.
      let photo: string | null | undefined = other?.avatarUrl ?? null;
      if (!photo && otherId) {
        const vendor = await mockVendorRepo.getByIdentityId(otherId);
        if (vendor?.profilePhotoUrl) photo = vendor.profilePhotoUrl;
      }
      const msgs = await mockMessageRepo.listByConversation(c.id, null, 1);
      const last = msgs[msgs.length - 1];
      const allMsgs = await mockMessageRepo.listByConversation(c.id, null, 200);
      const unread = allMsgs.filter(
        (m) => m.senderId !== identity.id && m.state !== "read",
      ).length;
      return {
        id: c.id,
        name: other?.name ?? "Someone",
        lastMessagePreview: last?.body ?? "",
        lastMessageAt: c.lastMessageAt,
        unread,
        photo,
      };
    }),
  );

  // P-A round 70: vendor persona gets the VENDOR shell (the old page hardcoded
  // role="shopper" — a vendor's Messages tab showed shopper nav + never the
  // vendor route's messaging affordances).
  const vendor = identity.vendorId
    ? await mockVendorRepo.getById(identity.vendorId)
    : null;
  const shellRole = vendor ? "vendor" : "shopper";

  return (
    <AppShell role={shellRole} userName={vendor?.name ?? identity.name ?? "You"} staffRole={staff?.staffRole ?? null}>
      <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
        <header style={{ marginBottom: "var(--space-3)", padding: "0 4px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", margin: 0, color: "var(--color-forest)" }}>
            Messages
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--role-text-muted)", margin: "4px 0 0" }}>
            {rows.length === 0
              ? "Start a conversation with any vendor or listing."
              : `${rows.length} conversation${rows.length === 1 ? "" : "s"} · unread marked bold`}
          </p>
        </header>
        <ConversationList rows={rows} />
      </main>
    </AppShell>
  );
}
