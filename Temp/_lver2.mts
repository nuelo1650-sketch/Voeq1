const a = await fetch("http://localhost:3031/api/listings/vis-ankara-cmpmtymm8pg").then((r) => r.json());
const L = a.listing ?? a;
console.log("keys:", Object.keys(L).join(",").slice(0, 200));
console.log("vendorId:", L.vendorId, "| categorySlug:", L.categorySlug);
const b = await fetch("http://localhost:3031/api/explore").then((r) => r.json());
console.log("explore n:", (b.data ?? []).length, "| vIds:", (b.data ?? []).slice(0, 4).map((l: { vendorId: string }) => l.vendorId));
