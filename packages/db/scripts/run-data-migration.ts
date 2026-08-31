import { readFileSync } from "fs";
import { Client } from "@neondatabase/serverless";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=(.*)/);
if (!m) { console.error("no DATABASE_URL"); process.exit(1); }
const client = new Client({ connectionString: m[1] });

const SA_SLUGS = ["nmu", "rhodes", "wits", "uct", "up", "ukzn", "tut", "cput", "uwc", "unisa"];
const PERSONAL_EMAILS = ["nuelo1650@gmail.com", "owiemmanuel2020@gmail.com", "voeq100@gmail.com"];
const NOW = new Date(0).toISOString();

const NIGERIAN = [
  { id: "nmu-okerenkoko", name: "Nigeria Maritime University (Okerenkoko)", slug: "nmu-okerenkoko", region: "Delta State", city: "Okerenkoko", state: "Delta State", lat: 5.62449, lng: 5.39038, source: "seeded", status: "verified", createdAt: NOW },
  { id: "nmu-kurutie", name: "Nigeria Maritime University (Kurutie)", slug: "nmu-kurutie", region: "Delta State", city: "Kurutie", state: "Delta State", lat: 5.62449, lng: 5.39038, source: "seeded", status: "verified", createdAt: NOW },
  { id: "unilag", name: "University of Lagos", slug: "unilag", region: "Lagos State", city: "Lagos", state: "Lagos State", lat: 6.51667, lng: 3.38611, source: "seeded", status: "verified", createdAt: NOW },
  { id: "ui", name: "University of Ibadan", slug: "ui", region: "Oyo State", city: "Ibadan", state: "Oyo State", lat: 7.3912, lng: 3.9167, source: "seeded", status: "verified", createdAt: NOW },
  { id: "oau", name: "Obafemi Awolowo University", slug: "oau", region: "Osun State", city: "Ile-Ife", state: "Osun State", lat: 7.51833, lng: 4.52278, source: "seeded", status: "verified", createdAt: NOW },
  { id: "unn", name: "University of Nigeria Nsukka", slug: "unn", region: "Enugu State", city: "Nsukka", state: "Enugu State", lat: 6.858, lng: 7.396, source: "seeded", status: "verified", createdAt: NOW },
  { id: "covenant", name: "Covenant University", slug: "covenant", region: "Ogun State", city: "Ota", state: "Ogun State", lat: 6.6699, lng: 3.1574, source: "seeded", status: "verified", createdAt: NOW },
  { id: "futo", name: "Federal University of Technology Owerri", slug: "futo", region: "Imo State", city: "Owerri", state: "Imo State", lat: 5.384, lng: 6.995, source: "seeded", status: "verified", createdAt: NOW },
  { id: "uniben", name: "University of Benin", slug: "uniben", region: "Edo State", city: "Benin City", state: "Edo State", lat: 6.33370, lng: 5.60015, source: "seeded", status: "verified", createdAt: NOW },
  { id: "abu", name: "Ahmadu Bello University", slug: "abu", region: "Kaduna State", city: "Zaria", state: "Kaduna State", lat: 11.067, lng: 7.700, source: "seeded", status: "verified", createdAt: NOW },
  { id: "unijos", name: "University of Jos", slug: "unijos", region: "Plateau State", city: "Jos", state: "Plateau State", lat: 9.95028, lng: 8.88917, source: "seeded", status: "verified", createdAt: NOW },
];

async function main() {
  await client.connect();
  try {
    await client.query("BEGIN");

    // 1. Seed 11 Nigerian campuses
    for (const c of NIGERIAN) {
      await client.query(
        `INSERT INTO campuses (id, name, slug, region, city, state, lat, lng, source, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (slug) DO NOTHING`,
        [c.id, c.name, c.slug, c.region, c.city, c.state, c.lat, c.lng, c.source, c.status, c.createdAt],
      );
    }
    console.log("1. SEEDED_NIGERIAN:", NIGERIAN.length);

    // 2. Reassign ALL identities on SA campuses -> nmu-okerenkoko (preserves the 3 personal
    //    accounts AND avoids dangling campus refs on seed/dev accounts)
    const reassigned = await client.query(
      `UPDATE identities SET campus = 'nmu-okerenkoko'
       WHERE campus = ANY($1) RETURNING email, campus`,
      [SA_SLUGS],
    );
    console.log("2. REASSIGNED_IDENTITIES:", reassigned.rowCount, JSON.stringify(reassigned.rows));

    // 2b. Reassign user_preferences on SA campuses -> nmu-okerenkoko
    const prefsReassigned = await client.query(
      `UPDATE user_preferences SET campus = 'nmu-okerenkoko'
       WHERE campus = ANY($1) RETURNING identity_id`,
      [SA_SLUGS],
    );
    console.log("2b. REASSIGNED_PREFS:", prefsReassigned.rowCount);
    const listingsDel = await client.query(
      `DELETE FROM listings WHERE vendor_id IN (
         SELECT id FROM vendors WHERE campus = ANY($1)
       )`,
      [SA_SLUGS],
    );
    console.log("3. DELETED_LISTINGS:", listingsDel.rowCount);

    // 4. Delete vendors on SA campuses
    const vendorsDel = await client.query(
      `DELETE FROM vendors WHERE campus = ANY($1)`,
      [SA_SLUGS],
    );
    console.log("4. DELETED_VENDORS:", vendorsDel.rowCount);

    // 5. Delete SA campus rows
    const campsDel = await client.query(
      `DELETE FROM campuses WHERE slug = ANY($1)`,
      [SA_SLUGS],
    );
    console.log("5. DELETED_SA_CAMPUSES:", campsDel.rowCount);

    await client.query("COMMIT");
    console.log("COMMITTED");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("ROLLED_BACK", (e as Error).message);
    throw e;
  } finally {
    await client.end();
  }
}
main().catch((e) => { console.error("FATAL", e.message); process.exit(1); });
