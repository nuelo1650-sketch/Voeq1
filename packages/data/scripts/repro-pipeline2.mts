// In-pipeline: full dataUrl -> cloudinary -> NEW url -> sightengine the FRESH url.
import { readFileSync } from "fs";
const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
const get = (n: string) => new RegExp(`^${n}=(.+)$`, "m").exec(env)?.[1]?.trim();
for (const k of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "SIGHTENGINE_API_USER", "SIGHTENGINE_API_SECRET", "SIGHTENGINE_USER", "SIGHTENGINE_SECRET"]) {
  const v = get(k);
  if (v) process.env[k] = v.trim();
}
import { uploadAndModerate } from "../src/media";


// the full jpg (real, 1x1)
const jpg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==";

console.log("FULL PIPELINE:");
const r = await uploadAndModerate({ fileName: "avatar-test.jpg", bytes: 240, dataUrl: jpg, mimeType: "image/jpeg" });
console.log(JSON.stringify(r).slice(0, 160));

console.log("SIGHTENGINE ON FRESH URL (direct):");
// use the jollof (known URL) to verify what happens when url param works
const s2 = await uploadAndModerate({ fileName: "known.jpg", bytes: 100, dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD", mimeType: "image/jpeg" });
console.log(JSON.stringify(s2).slice(0, 120));
