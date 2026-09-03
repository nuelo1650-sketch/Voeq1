// Reproduce the exact pipeline the API route uses.
import { readFileSync } from "fs";
import { uploadImage } from "../src/images";
import { uploadAndModerate } from "../src/media";

const env = readFileSync("C:/Users/Legacy/Documents/voeq/apps/web/.env.local", "utf8");
for (const k of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "SIGHTENGINE_API_USER", "SIGHTENGINE_API_SECRET", "SIGHTENGINE_USER", "SIGHTENGINE_SECRET"]) {
  const v = new RegExp(`^${k}=(.+)$`, "m").exec(env)?.[1];
  if (v) process.env[k] = v.trim();
}

const jpg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==";

console.log("--- uploadImage (route path) ---");
const r1 = await uploadImage({ fileName: "avatar-test.jpg", context: "vendor_photo", bytes: 240, dataUrl: jpg, mimeType: "image/jpeg" });
console.log(JSON.stringify(r1).slice(0, 160));

console.log("--- uploadAndModerate direct ---");
const r2 = await uploadAndModerate({ fileName: "avatar-test.jpg", bytes: 240, dataUrl: jpg, mimeType: "image/jpeg" });
console.log(JSON.stringify(r2).slice(0, 160));
