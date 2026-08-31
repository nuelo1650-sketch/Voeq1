import { neon } from "@neondatabase/serverless";

const prodUrl = process.env.DATABASE_URL!;
const prod = neon(prodUrl.replace(/channel_binding=require&?/, ""));
const v = await prod("SELECT (SELECT count(*)::int FROM vendors) AS vendors, (SELECT count(*)::int FROM identities) AS identities, (SELECT count(*)::int FROM listings) AS listings, (SELECT count(*)::int FROM campuses) AS campuses, (SELECT count(*)::int FROM categories) AS categories");
console.log(JSON.stringify(v[0]));
const names = await prod("SELECT name, campus, status FROM vendors ORDER BY created_at DESC LIMIT 12");
console.log("vendors:", JSON.stringify(names));
process.exit(0);
