/**
 * JS payload audit: fetch a page, extract every <script src>, sum the bytes.
 * Answers: did today's deploys bloat the client bundle? Bisect across the
 * four live deployments (3 previews + current prod) + per-page on prod.
 * Usage: npx tsx scripts/js-payload-audit.mts <url> [<url>...]
 */
const targets = process.argv.slice(2);
if (!targets.length) { console.error("pass at least one URL"); process.exit(1); }

for (const base of targets) {
  try {
    const html = await (await fetch(base, { headers: { "user-agent": "Mozilla/5.0 (compatible; probe)" } })).text();
    const srcs = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);
    const urls = srcs.map((s) => new URL(s, base).toString());
    let total = 0;
    const sizes: { url: string; size: number }[] = [];
    await Promise.all(urls.map(async (u) => {
      try {
        // ranged GET: Vercel serves compressed + no reliable HEAD content-length
        const r = await fetch(u, { headers: { "range": "bytes=0-0" } });
        const cr = r.headers.get("content-range"); // bytes 0-0/TOTAL
        const len = cr ? Number(cr.split("/")[1]) : 0;
        if (len) { total += len; sizes.push({ url: u, size: len }); }
      } catch { /* skip */ }
    }));
    sizes.sort((a, b) => b.size - a.size);
    const kb = (n: number) => Math.round(n / 1024);
    console.log(`\n== ${base}`);
    console.log(`   scripts: ${urls.length}  total: ${kb(total)}KB`);
    for (const s of sizes.slice(0, 6)) console.log(`   ${String(kb(s.size)).padStart(5)}KB  ${s.url.replace(base, "").slice(0, 70)}`);
  } catch (e: any) {
    console.log(`\n== ${base}\n   FETCH FAILED: ${String(e).slice(0, 100)}`);
  }
}
