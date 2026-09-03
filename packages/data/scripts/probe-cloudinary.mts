// Cloudinary upload in isolation — where does IT fail?
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const get = (n: string) => new RegExp(`^${n}=(.+)$`, "m").exec(env)?.[1]?.trim();

const cloud = get("CLOUDINARY_CLOUD_NAME");
const key = get("CLOUDINARY_API_KEY");
const secret = get("CLOUDINARY_API_SECRET");
const ts = Math.floor(Date.now() / 1000);
const folder = "voeq";
const toSign = `folder=${folder}&timestamp=${ts}${secret}`;
const { createHash } = await import("node:crypto");
const sig = createHash("sha1").update(toSign).digest("hex");
const body = new URLSearchParams({
  file: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==",
  folder,
  timestamp: String(ts),
  api_key: key ?? "",
  signature: sig,
});
console.log("cloud:", Boolean(cloud), "key:", Boolean(key), "secret:", Boolean(secret), "toSign len:", toSign.length);
const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  signal: AbortSignal.timeout(20000),
  body,
});
console.log("CLOUDINARY HTTP:", r.status);
console.log("CLOUDINARY BODY:", (await r.text()).slice(0, 260));
