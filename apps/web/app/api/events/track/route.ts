import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mockAuthRepo, mockPageEventStore } from "@voeq/data";
import { z } from "zod";
import { createHash } from "crypto";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * P-A round 60 — Activity event tracking (privacy-respecting).
 *
 * Client fires-and-forgets this for views/clicks. Server resolves the current
 * identity (if signed in), NEVER accepts email/name/body — the schema here is
 * strictly type + refId + path. Raw IP is never stored; only a salted hash
 * (for abuse dedup). Events land in append-only page_events.
 */

const schema = z.object({
  type: z.enum([
    "listing_view",
    "storefront_view",
    "vendor_profile_view",
    "message_click",
    "save_item",
    "follow_item",
    "like_item",
    "comment_created",
    "search",
    "category_browse",
    "report_click",
    "login",
    "signup",
    "go_live",
  ]),
  refId: z.string().max(80).optional(),
  path: z.string().max(160).optional(),
});

// Salted hash so we can dedupe devices without ever storing a raw IP.
function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.EVENT_IP_SALT ?? "voeq-events";
  return createHash("sha256").update(salt + ip).digest("hex").slice(0, 24);
}

function platformOf(ua: string): string {
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/windows/i.test(ua)) return "windows";
  if (/macintosh|mac os/i.test(ua)) return "macos";
  return "other";
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_event" }, { status: 400 });

  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  const identity = sessionId ? await mockAuthRepo.currentIdentity(sessionId) : null;

  const ua = req.headers.get("user-agent") ?? "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  try {
    await mockPageEventStore.log({
      identityId: identity?.id ?? null,
      type: parsed.data.type,
      refId: parsed.data.refId ?? null,
      path: parsed.data.path ?? null,
      platform: platformOf(ua),
      ipHash: hashIp(ip),
    });
  } catch (e) {
    // Tracking must never break the product — swallow and log.
    console.error(`[events] track failed: ${e instanceof Error ? e.message : e}`);
  }

  return NextResponse.json({ ok: true });
}
