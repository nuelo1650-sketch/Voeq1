import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const m = env.match(/DATABASE_URL=([^\n\r]+)/);
const sql = neon(m[1]);
async function main() {
  const CLOUD = "https://res.cloudinary.com/jq9gwigz/image/upload/v1788151594/voeq-demo";
  const photos: Record<string, string> = {
    "demo-mama-nkechi-kitchen": `${CLOUD}/jollof-bowl.jpg`,
    "demo-glam-by-zee": `${CLOUD}/wig-install.jpg`,
    "demo-fixit-campus": `${CLOUD}/phone-repair.jpg`,
  };
  const vs: any[] = await sql`SELECT id, name, slug, profile_photo_url FROM vendors`;
  for (const v of vs) {
    const photo = photos[v.slug];
    if (photo && !v.profile_photo_url) {
      await sql`UPDATE vendors SET profile_photo_url = ${photo} WHERE id = ${v.id}`;
      console.log("set photo:", v.name);
    } else {
      console.log("skip:", v.name, v.profile_photo_url ? "(has photo)" : "(no photo map)");
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
