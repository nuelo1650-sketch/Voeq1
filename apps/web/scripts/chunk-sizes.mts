/** Sum built chunk sizes per name pattern from .next/static/chunks. */
import { readdirSync, statSync } from "fs";

const dir = "C:/Users/Legacy/Documents/voeq/apps/web/.next/static/chunks";
const files = readdirSync(dir).filter((f) => f.endsWith(".js"));
let total = 0;
const rows: { f: string; size: number }[] = [];
for (const f of files) {
  const size = statSync(`${dir}/${f}`).size;
  total += size;
  rows.push({ f, size });
}
rows.sort((a, b) => b.size - a.size);
console.log(`chunks: ${files.length}  total: ${Math.round(total / 1024)}KB (uncompressed)`);
for (const r of rows.slice(0, 8)) console.log(`${String(Math.round(r.size / 1024)).padStart(5)}KB  ${r.f}`);
