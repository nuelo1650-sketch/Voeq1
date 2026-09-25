import { NextRequest, NextResponse } from "next/server";
import { mockPushSubscriptionRepo } from "@voeq/data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, p256dh, auth, identityId } = body;
    if (!endpoint || !p256dh || !auth || !identityId) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    const sub = await mockPushSubscriptionRepo.create({ endpoint, p256dh, auth, identityId });
    return NextResponse.json({ ok: true, subscription: sub }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint } = body;
    if (!endpoint) return NextResponse.json({ error: "missing_endpoint" }, { status: 400 });
    await mockPushSubscriptionRepo.deleteByEndpoint(endpoint);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
