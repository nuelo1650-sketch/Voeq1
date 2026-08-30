import { getDb } from "@voeq/db";
import * as s from "@voeq/db/schema";
import { sql } from "drizzle-orm";

const db = getDb();
const campuses = await db.select().from(s.campuses);
console.log("total campuses:", campuses.length);
const ids = campuses.map((c) => c.id);
const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
console.log("duplicate ids:", dups.length ? dups : "none");
const bySlug = new Map<string, number>();
for (const c of campuses) bySlug.set(c.slug, (bySlug.get(c.slug) ?? 0) + 1);
console.log("duplicate slugs:", [...bySlug.entries()].filter(([, n]) => n > 1).map(([k]) => k));
const byState = new Map<string, number>();
for (const c of campuses) byState.set(c.state, (byState.get(c.state) ?? 0) + 1);
console.log("by state:", JSON.stringify(Object.fromEntries(byState)));
process.exit(0);
