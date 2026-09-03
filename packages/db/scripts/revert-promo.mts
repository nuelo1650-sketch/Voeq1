import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
const after: any[] = await sql`SELECT email, staff_role FROM identities WHERE id = 'de0ae9fa-6ecc-49a0-a8e8-2754242e55a9'`;
console.log("after promo:", JSON.stringify(after));
await sql`UPDATE identities SET staff_role = NULL WHERE id = 'de0ae9fa-6ecc-49a0-a8e8-2754242e55a9'`;
console.log("reverted to shopper");
