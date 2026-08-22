# VS6 — Real Chat System + Image Infrastructure (Expanded, 21 chunks)

Brief: user msg 18264 (expanded) + locked Q1–Q8 decisions (typing ✅, date sep ✅,
last seen ✅, draft ✅, image attach ❌ out of Phase 1, report ✅ + admin "block while
waiting" prompt, read-only ✅, loading/error+char-counter ✅). Standalone Go received
on expanded brief. ONE GATE, all 21 chunks, verify after each, STOP at VS6.21 for review
(NO commit without 2nd Go).

## DISK RECONCILIATIONS (verified, change execution)
1. `Conversation`/`Message` types EXIST (interfaces L87/L93). `Message.state` already
   `pending|sent|delivered|failed`. VS6.4 = build repos only.
2. `media.ts` (VS3.3) has `uploadAndModerate`/`mockCloudinaryUpload`/`mockSightengineModerate`.
   VS6.1 `images.ts` WRAPS it (no duplicate moderation). VS6.3 = verify only.
3. Package is `@voeq/data` (brief's `@file:` tokens are chat noise — ignore).
4. `NotificationType` ALREADY includes `new_message` (L352). `Notification`/`NotificationRepo` exist.
   VS6.19 reuses.
5. `Report.targetType` = `"listing"|"vendor"` — VS6.10 adds `"message"` (extend-only).
   `ReportRepo.create` accepts `category`+`body`; `ReportCategory` exists (L332).
6. Rate-limit infra EXISTS (`rate-limit.ts` `checkRateLimit`, `RateLimitStore`). VS6.6 reuses.
7. NO `mockConversationRepo`/`mockMessageRepo`/`images.ts`/`messaging.ts` — build in VS6.1/6.4.
8. `index.ts` missing `./images`+`./messaging` — add.

## Data contracts (extend-only on LOCKED interfaces.ts)
- `Conversation` + `createdAt: string`.
- `Message` + `readAt?: string | null` + `clientMsgId?: string` (idempotency).
- `Conversation.lastSeen: Record<string, string>` (for last-seen, honest).
- `Report.targetType` + `"message"`.
- NEW `ImageContext` type + `UploadResult` type (in images.ts or interfaces).
- NEW `packages/data/src/images.ts` — `uploadImage({fileName,bytes?,mimeType?,context}): Promise<UploadResult>` wraps `uploadAndModerate`.
- NEW `packages/data/src/messaging.ts` — `mockConversationRepo` (find-or-create by participant pair), `mockMessageRepo` (create/listByConversation/updateState/markDelivered/markRead), `resetMessagingState()`.

## 21 chunks (per-chunk tsc-both + curl; STOP at VS6.21, no commit)
GROUP A (foundation): 6.1 images module+contracts · 6.2 POST /api/images/upload · 6.3 verify moderation · 6.4 messaging repos · 6.5 POST /api/conversations (idempotent) · 6.6 POST /api/conversations/[id]/messages (participant, 1–4000, rate-limit 30/min, clientMsgId idempotency)
GROUP B (routes+state): 6.7 GET messages (403 IDOR, markDelivered, cursor) · 6.8 FAIL_TEST→503 + retry button · 6.9 sent→delivered→read + POST /api/conversations/[id]/read · 6.10 message report (targetType message + StaffCase + admin notif "block while waiting") · 6.11 read-only suspended vendor (403 send, can read)
GROUP C (UX): 6.12 UI foundation (messages list + thread + bubble + composer, mobile-first) · 6.13 relative+absolute timestamps · 6.14 date separators · 6.15 typing indicator (mock) · 6.16 last seen/online (honest) · 6.17 read receipt timestamp · 6.18 draft localStorage + char counter + loading/error
GROUP D (notif+cleanup): 6.19 new_message notification (generic body, no leak) · 6.20 migrate vendor/photo route to uploadImage · 6.21 cleanup + full E2E + STOP for review.

## Locked policies (Doc 13 §13.M / Doc 09)
Native chat only (WhatsApp BANNED) · one conv per (shopper,vendor) · participant-only (IDOR 403) ·
server-authoritative state · never silent loss · no message body in notifications · read-only
suspended vendor (server-enforced) · no fake last-seen/read-receipts (derived from real events) ·
image attach OUT of Phase 1 (message_attachment context reserved, not wired).

## Two-gate rhythm override
Founder: "ONE GATE, ALL 21 CHUNKS." Execute all, verify each, stop at VS6.21 for review.

## Verification
tsc both packages = 0 after each group · next dev (:3001, :3000 wedged) clean boot ·
curl routes 200 · grep guards: `WhatsApp` in messaging→0, `uploadAndModerate` in apps/web→0
(post 6.20), `setGated`/`isPublic`/`unsplash`/`onboardingInterests`→0, `fake`/`mocked` in UI text→0.
Full E2E (VS6.21): idempotent conv, optimistic send, delivered/read, date sep, typing, last seen,
char counter, draft persist, FAIL_TEST retry, report+admin notif, suspended read-only, non-part
403, new_message notif (generic).

## Admin surface note (VS7)
VS6.10 creates the message-report route + StaffCase + admin `system` notification with "Would you
like to block while waiting?" body + refId=caseId. The `/admin` UI (`ReportNotificationCard`) is
VS7 (does not exist yet). Stub the click target now (link to `/staff/reports/[caseId]` future) and
flag. Do NOT build /admin in VS6.

## Risks
- next dev hot-reload resets in-memory store → warm routes + E2E in one script (VS5 lesson).
- Port 3000 ghost socket → use :3001.
- `next build` stricter than tsc for route `params` (VS5.10 lesson): keep resource actions in
  dynamic `[id]` segments, not collection routes. E2E via dev server validates this.
