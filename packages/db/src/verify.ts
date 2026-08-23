import { getDb } from "./client";
import { sql } from "drizzle-orm";

const db = getDb();
const r: unknown = await db.execute(sql.raw(`SELECT count(*)::int AS c FROM vendors`));
console.log("RAW:", JSON.stringify(r).slice(0, 300));
