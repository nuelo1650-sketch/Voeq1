// Isolate the Sightengine failure: raw HTTP status + body keys (no PII).
import { readFileSync } from "fs";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const get = (n: string) => new RegExp(`^${n}=(.+)$`, "m").exec(env)?.[1]?.trim();

const user = get("SIGHTENGINE_API_USER") ?? get("SIGHTENGINE_USER");
const secret = get("SIGHTENGINE_API_SECRET") ?? get("SIGHTENGINE_SECRET");

const params = new URLSearchParams({
  url: "https://res.cloudinary.com/jq9gwigz/image/upload/v1788151594/voeq-demo/jollof-bowl.jpg",
  models: "properties,nudity,wad",
  api_user: user ?? "",
  api_secret: secret ?? "",
});

console.log("user set:", Boolean(user), "| secret set:", Boolean(secret));
try {
  const r = await fetch("https://api.sightengine.com/1.0/check.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    signal: AbortSignal.timeout(15_000),
    body: params,
  });
  const text = await r.text();
  console.log("SIGHTENGINE HTTP:", r.status);
  console.log("BODY (first 200):", text.slice(0, 200));
} catch (e) {
  console.log("FETCH THREW:", e instanceof Error ? e.message : String(e));
}
