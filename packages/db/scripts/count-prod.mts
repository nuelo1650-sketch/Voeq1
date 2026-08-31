import { neon } from "@neondatabase/serverless";

const prodUrl = process.env.DATABASE_URL!;
const prod = neon(prodUrl.replace(/channel_binding=require&?/, ""));
const v = await prod("SELECT (SELECT count(*)::int FROM vendors) AS v, (SELECT count(*)::int FROM identities) AS i, (SELECT count(*)::int FROM listings) AS l");
console.log(`PROD before: vendors=${v[0].v} identities=${v[0].i} listings=${v[0].l}`);
process.exit(0);
