/** SECURITY CHECK: can a malicious client bypass Sightengine moderation in
 *  PROD by passing force:"pass" or a naked non-Cloudinary URL to
 *  /api/images/upload? (founder rule: fail-closed, Cloudinary-only) */
process.env.NODE_ENV = "production";
process.env.CLOUDINARY_CLOUD_NAME = "testcloud";
process.env.CLOUDINARY_API_KEY = "k";
process.env.CLOUDINARY_API_SECRET = "s";
process.env.SIGHTENGINE_API_USER = "u";
process.env.SIGHTENGINE_API_SECRET = "s";

const { uploadAndModerateByUrl } = await import("../../data/src/media.ts");

// 1) force:"pass" with a malicious URL — must NOT skip moderation
const r1 = await uploadAndModerateByUrl({
  fileName: "innocent.jpg",
  context: "listing",
  url: "https://evil.example.com/nsfw.jpg",
  force: "pass",
}).catch((e) => ({ ok: false, reason: "threw: " + String(e).slice(0, 80) }));
console.log("force=pass evil url ->", JSON.stringify(r1).slice(0, 120));

// 2) naked URL (not Cloudinary) — must be rejected by the Cloudinary-only gate
const r2 = await uploadAndModerateByUrl({
  fileName: "x.jpg",
  context: "listing",
  url: "https://evil.example.com/x.jpg",
}).catch((e) => ({ ok: false, reason: "threw: " + String(e).slice(0, 80) }));
console.log("naked evil url  ->", JSON.stringify(r2).slice(0, 120));
process.exit(0);
