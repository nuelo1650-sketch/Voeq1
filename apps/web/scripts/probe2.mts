/**
 * Probe 2: does mockIdentityRepo.patch persist campus against real Neon?
 * Direct mirror of what set-campus + step-1 do.
 */
import { mockIdentityRepo, mockVendorRepo } from "@voeq/data/server";
import { getDb } from "@voeq/db";
import * as s from "@voeq/db/schema";

const db = getDb();
const all = await db.select().from(s.identities);
const sweep = all.find((i) => i.email.includes("sweep-vendor") && i.accountStatus === "active");
console.log("before: campus =", sweep?.campus, "| vendorId =", sweep?.vendorId);

// 1) patch campus exactly like set-campus route
const patched = await mockIdentityRepo.patch(sweep!.id, { campus: "unilag" });
console.log("patch() returned campus:", patched?.campus);

// 2) raw table read
const after = await db.select().from(s.identities).where(sqlEq(s.identities.id, sweep!.id));
console.log("after raw row: campus =", after[0]?.campus, "| vendorId =", after[0]?.vendorId);

function sqlEq(col: any, val: string) {
  // tiny helper to avoid importing eq/drizzle operator name variance
  const { eq } = require("drizzle-orm") as typeof import("drizzle-orm");
  return eq(col, val);
}
process.exit(0);
