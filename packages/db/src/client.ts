/**
 * D.2 — Neon client + Drizzle instance (LAZY).
 * Does NOT throw at import time — `db` is null until a query runs with a
 * DATABASE_URL present. This keeps the @voeq/data bundle safe to import in
 * mock/dev mode (no DATABASE_URL), and the factory (packages/data/src/real.ts)
 * only uses it when DATABASE_URL is set.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is required to query the database.");
    _db = drizzle(neon(url), { schema });
  }
  return _db;
}

export const schemaRef = schema;
export type { NeonHttpDatabase };
