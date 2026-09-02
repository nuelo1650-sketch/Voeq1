import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/lib/session";
import { ConversationList, type ConversationRow } from "@/components/messaging/ConversationList";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/login?next=/messages");

  const { mockConversationRepo, mockMessageRepo, mockIdentityRepo } = await import("@voeq/data");
  const conversations = await mockConversationRepo.listForIdentity(identity.id);
  const rows: ConversationRow[] = await Promise.all(
    conversations.map(async (c) => {
      const otherId = c.participantIds.find((p) => p !== identity.id) ?? "";
      const other = otherId ? await mockIdentityRepo.getById(otherId) : null;
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
        // P-A round 49: inbox avatar (identity profile photo when set).
        photo: other?.avatarUrl ?? null
      };
    }),
  );

  return (
    <AppShell role="shopper" userName={identity.name}>
      <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h2)" }}>Messages</h1>
        <ConversationList rows={rows} />
      </main>
    </AppShell>
  );
}
