import { NextResponse } from "next/server";
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";
export async function GET() {
  if (!VAPID_PUBLIC) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  return NextResponse.json({ key: VAPID_PUBLIC });
}
