import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { mockVendorRepo } from "@voeq/data";

/**
 * VS7.20 — Shareable vendor link. Returns the canonical /v/{slug} URL, pre-built
 * social share URLs (Twitter/Facebook/Instagram), and a QR data URL. No WhatsApp
 * messaging (founder 2026-08-22: messaging banned; only WhatsApp Status marketing
 * is allowed, which is a manual user action, not an auto-link).
 */
export async function GET(req: NextRequest) {
  const vendorId = req.nextUrl.searchParams.get("vendorId");
  if (!vendorId) return NextResponse.json({ error: "vendorId_required" }, { status: 400 });

  const vendor = await mockVendorRepo.getById(vendorId);
  if (!vendor) return NextResponse.json({ error: "vendor_not_found" }, { status: 404 });

  const base = new URL(req.nextUrl.origin);
  const canonical = `${base.origin}/v/${vendor.slug}`;
  const text = encodeURIComponent(`Check out ${vendor.name} on Voeq`);
  const social = {
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(canonical)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}`,
    instagram: canonical, // IG has no native web share URL; user copies link to their Story
  };
  const qr = await QRCode.toDataURL(canonical, { width: 240, margin: 1 });

  return NextResponse.json({ ok: true, canonical, social, qr }, { status: 200 });
}
