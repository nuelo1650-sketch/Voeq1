// Dump the Sightengine 400 body to a file for exact reason.
import { readFileSync, writeFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const get = (n: string) => new RegExp(`^${n}=(.+)$`, "m").exec(env)?.[1]?.trim();
const user = get("SIGHTENGINE_API_USER") ?? get("SIGHTENGINE_USER");
const secret = get("SIGHTENGINE_API_SECRET") ?? get("SIGHTENGINE_SECRET");
const url = "https://res.cloudinary.com/jq9gwigz/image/upload/v1788349269/voeq/eyqvx2txrre6vhuoi0mc.jpg";
const params = new URLSearchParams({ url, models: "properties,nudity,wad", api_user: user ?? "", api_secret: secret ?? "" });
const r = await fetch("https://api.sightengine.com/1.0/check.json", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  signal: AbortSignal.timeout(15000),
  body: params,
});
const t = await r.text();
writeFileSync("C:/Users/Legacy/AppData/Local/Temp/se-400.json", t);
console.log("HTTP:", r.status, "| body bytes:", t.length, "| saved");
console.log("keys:", Object.keys(JSON.parse(t)).join(","));
const d = JSON.parse(t);
console.log("error-ish:", d.error ?? d.errors ?? d.invalid ?? JSON.stringify(d).slice(0, 300));
