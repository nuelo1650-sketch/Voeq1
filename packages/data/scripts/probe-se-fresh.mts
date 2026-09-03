// Probe Sightengine against a FRESH cloudinary URL (just uploaded) vs demo URL.
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const get = (n: string) => new RegExp(`^${n}=(.+)$`, "m").exec(env)?.[1]?.trim();
const user = get("SIGHTENGINE_API_USER") ?? get("SIGHTENGINE_USER");
const secret = get("SIGHTENGINE_API_SECRET") ?? get("SIGHTENGINE_SECRET");

const urls = {
  demo: "https://res.cloudinary.com/jq9gwigz/image/upload/v1788151594/voeq-demo/jollof-bowl.jpg",
  fresh: "https://res.cloudinary.com/jq9gwigz/image/upload/v1788349269/voeq/eyqvx2txrre6vhuoi0mc.jpg",
};
for (const [k, url] of Object.entries(urls)) {
  const params = new URLSearchParams({ url, models: "properties,nudity,wad", api_user: user ?? "", api_secret: secret ?? "" });
  try {
    const r = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(15000),
      body: params,
    });
    const t = (await r.text()).slice(0, 140);
    console.log(k, "-> HTTP", r.status, "|", t);
  } catch (e) {
    console.log(k, "-> THREW:", e instanceof Error ? e.message : String(e));
  }
}
