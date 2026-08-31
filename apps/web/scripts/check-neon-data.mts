/**
 * Direct reproduction: step-1's exact create path against real Neon.
 * Mirrors the route line-by-line to find where Sweep Kitchen disappears.
 */
import { mockVendorRepo, mockIdentityRepo } from "@voeq/data/server";

// 1) find a sweep identity with its campus
const idents = await (await import("@voeq/data/server")).mockIdentityRepo;
// pick the active sweep-vendor identity
const all = await (await import("@voeq/db")).getDb().select().from((await import("@voeq/db/schema")).identities);
const sweepIdent = all.find((i) => i.email.includes("sweep-vendor") && i.accountStatus === "active");
console.log("sweep identity:", sweepIdent?.email, "| campus:", sweepIdent?.campus, "| vendorId:", sweepIdent?.vendorId);

if (!sweepIdent) {
  console.log("NO SWEEP IDENTITY — auth chain created them, but they're missing");
  process.exit(0);
}

// 2) call create exactly as step-1 does
const vendor = await mockVendorRepo.create({
  identityId: sweepIdent.id,
  name: "Direct Probe Kitchen",
  campus: sweepIdent.campus ?? "unilag",
  categoryIds: ["food"],
  description: "Direct probe of the step-1 create path with a long enough description over 50 chars.",
  status: "pending_listings",
});
console.log("create returned:", vendor.id, vendor.name, vendor.status);

// 3) did it land in Neon?
const check = await mockVendorRepo.getById(vendor.id);
console.log("getById after create:", check ? `FOUND (${check.name})` : "NOT FOUND — create silently dropped");
process.exit(0);
