import { mockIdentityRepo } from "@voeq/data/server";
import { getDb } from "@voeq/db";
import * as s from "@voeq/db/schema";
import { eq } from "drizzle-orm";

const db = getDb();
const all = await db.select().from(s.identities);
const sweep = all.find((i) => i.email.includes("sweep-vendor") && i.accountStatus === "active");
console.log("before: campus =", sweep?.campus, "| vendorId =", sweep?.vendorId);

const patched = await mockIdentityRepo.patch(sweep!.id, { campus: "unilag" });
console.log("patch() returned campus:", patched?.campus);

const after = await db.select().from(s.identities).where(eq(s.identities.id, sweep!.id));
console.log("after raw row: campus =", after[0]?.campus, "| vendorId =", after[0]?.vendorId);
process.exit(0);
